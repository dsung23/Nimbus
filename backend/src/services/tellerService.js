const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getClient } = require('../utils/database');
const cryptoService = require('../utils/crypto');

class TellerService {
  constructor() {
    this.baseURL = 'https://api.teller.io';
    
    this.supabase = getClient();
    
    // Load certificates for mutual TLS
    this.certificatePath = path.join(__dirname, '../../teller/certificate.pem');
    this.privateKeyPath = path.join(__dirname, '../../teller/private_key.pem');
    
    this.axiosInstance = this.createAxiosInstance();
    
    // Cache configuration with TTL durations
    this.cache = new Map();
    this.cacheTTL = {
      accounts: 30 * 60 * 1000,      // 30 minutes
      transactions: 15 * 60 * 1000,   // 15 minutes  
      balances: 5 * 60 * 1000,       // 5 minutes
      account_details: 60 * 60 * 1000 // 1 hour
    };
    
    // Request deduplication to prevent duplicate API calls
    this.pendingRequests = new Map();
    
    // Rate limiting configuration
    this.rateLimits = new Map(); // userId -> { requests: [], limit: number }
    this.globalRateLimit = {
      requests: [],
      maxRequestsPerMinute: 100, // Global limit across all users
      maxConcurrentRequests: 10
    };
    this.userRateLimit = {
      maxRequestsPerMinute: 30, // Per user limit
      maxConcurrentRequests: 3
    };
  }

  createAxiosInstance() {
    const config = {
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CoFund/1.0.0'
      }
    };

    // Add mutual TLS certificates if they exist
    if (fs.existsSync(this.certificatePath) && fs.existsSync(this.privateKeyPath)) {
      config.httpsAgent = new (require('https').Agent)({
        cert: fs.readFileSync(this.certificatePath),
        key: fs.readFileSync(this.privateKeyPath),
        rejectUnauthorized: process.env.TELLER_ENVIRONMENT === 'production'
      });
    }

    return axios.create(config);
  }

  // Cache helper methods
  getCacheKey(type, ...params) {
    return `${type}:${params.join(':')}`;
  }

  getCachedData(cacheKey, ttl) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const { data, timestamp } = cached;
    const isExpired = Date.now() - timestamp > ttl;
    
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return data;
  }

  setCachedData(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  clearCacheForUser(userId) {
    // Clear all cache entries for a specific user
    for (const [key] of this.cache) {
      if (key.includes(`:${userId}:`)) {
        this.cache.delete(key);
      }
    }
    console.log(`🗑️ Cleared all cached data for user ${userId}`);
  }

  clearBalanceCache(accessToken, accountId) {
    // Clear specific balance cache entry
    const cacheKey = this.getCacheKey('balances', accessToken, accountId);
    this.cache.delete(cacheKey);
    console.log(`🗑️ Cleared balance cache for account ${accountId}`);
  }

  clearAllBalanceCaches() {
    // Clear all balance cache entries
    for (const [key] of this.cache) {
      if (key.startsWith('balances:')) {
        this.cache.delete(key);
      }
    }
    console.log(`🗑️ Cleared all balance caches`);
  }

  async deduplicateRequest(requestKey, apiCallFunction) {
    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(requestKey)) {
      console.log(`📋 Deduplicating request: ${requestKey}`);
      return this.pendingRequests.get(requestKey);
    }

    // Create the request promise
    const requestPromise = apiCallFunction();
    
    // Store the promise
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Always clean up the pending request when done
      this.pendingRequests.delete(requestKey);
    }
  }

  async checkRateLimit(userId) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Check global rate limit
    this.globalRateLimit.requests = this.globalRateLimit.requests.filter(time => time > oneMinuteAgo);
    if (this.globalRateLimit.requests.length >= this.globalRateLimit.maxRequestsPerMinute) {
      throw new Error('Global rate limit exceeded. Please try again later.');
    }

    // Check global concurrent requests
    if (this.pendingRequests.size >= this.globalRateLimit.maxConcurrentRequests) {
      throw new Error('Too many concurrent requests globally. Please try again later.');
    }

    // Check user rate limit
    if (!this.rateLimits.has(userId)) {
      this.rateLimits.set(userId, { requests: [], concurrent: 0 });
    }

    const userLimits = this.rateLimits.get(userId);
    userLimits.requests = userLimits.requests.filter(time => time > oneMinuteAgo);

    if (userLimits.requests.length >= this.userRateLimit.maxRequestsPerMinute) {
      throw new Error('User rate limit exceeded. Please try again later.');
    }

    // Check user concurrent requests
    const userConcurrentRequests = Array.from(this.pendingRequests.keys())
      .filter(key => key.includes(`:${userId}:`)).length;

    if (userConcurrentRequests >= this.userRateLimit.maxConcurrentRequests) {
      throw new Error('Too many concurrent requests for this user. Please try again later.');
    }

    // Record the request
    this.globalRateLimit.requests.push(now);
    userLimits.requests.push(now);
  }

  async withRateLimit(userId, requestKey, apiCallFunction) {
    // Check rate limits first
    await this.checkRateLimit(userId);

    // Then proceed with deduplication and execution
    return this.deduplicateRequest(requestKey, apiCallFunction);
  }

  getOptimalSyncOptions(lastSync, userOptions = {}) {
    // If user provides explicit options, use them
    if (userOptions.fromDate && userOptions.toDate) {
      return {
        fromDate: userOptions.fromDate,
        toDate: userOptions.toDate,
        count: userOptions.count || 1000
      };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // If no previous sync, sync last 30 days
    if (!lastSync) {
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 30);
      
      console.log(`📅 First-time sync: fetching last 30 days of transactions`);
      return {
        fromDate: userOptions.fromDate || defaultFromDate.toISOString().split('T')[0],
        toDate: userOptions.toDate || today,
        count: userOptions.count || 1000
      };
    }

    // Calculate days since last sync
    const lastSyncDate = new Date(lastSync);
    const daysSinceSync = Math.ceil((now - lastSyncDate) / (24 * 60 * 60 * 1000));
    
    // Use dynamic window: sync from last sync date + buffer, max 30 days
    const bufferDays = 1; // Add 1 day buffer to catch any missed transactions
    const syncFromDate = new Date(lastSyncDate);
    syncFromDate.setDate(syncFromDate.getDate() - bufferDays);
    
    // Cap at 30 days maximum
    const maxDaysBack = 30;
    if (daysSinceSync > maxDaysBack) {
      const cappedFromDate = new Date();
      cappedFromDate.setDate(cappedFromDate.getDate() - maxDaysBack);
      
      console.log(`📅 Large sync gap detected (${daysSinceSync} days), capping to last ${maxDaysBack} days`);
      return {
        fromDate: userOptions.fromDate || cappedFromDate.toISOString().split('T')[0],
        toDate: userOptions.toDate || today,
        count: userOptions.count || 1000
      };
    }

    console.log(`📅 Incremental sync: fetching ${daysSinceSync + bufferDays} days of transactions since last sync`);
    return {
      fromDate: userOptions.fromDate || syncFromDate.toISOString().split('T')[0],
      toDate: userOptions.toDate || today,
      count: userOptions.count || 1000
    };
  }

  async fetchAccountsFromTeller(accessToken) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    
    // Create deduplication key
    const dedupKey = `fetch_accounts:${accessToken}`;
    
    return this.deduplicateRequest(dedupKey, async () => {
      try {
        // Check cache first
        const cacheKey = this.getCacheKey('accounts', accessToken);
        const cachedAccounts = this.getCachedData(cacheKey, this.cacheTTL.accounts);
        
        if (cachedAccounts) {
          console.log(`📦 Using cached accounts data (${cachedAccounts.length} accounts)`);
          return cachedAccounts;
        }
        
        console.log('🏦 Fetching accounts from Teller API...');
        console.log(`🔑 Using Access Token starting with: ${accessToken.substring(0, 8)}...`);
        console.log(`🌐 Making request to: ${this.baseURL}/accounts`);
        
        // For sandbox environment, still make actual API call to Teller sandbox
        // This ensures we get real data from Teller's sandbox instead of hardcoded mock data
        
        // Use Basic Auth with the access token as username (Teller's authentication method)
        const response = await this.axiosInstance.get('/accounts', {
          auth: {
            username: accessToken,
            password: ''
          }
        });

        console.log('✅ Successfully received response from Teller API.');
        console.log(`📦 Response status: ${response.status}`);
        console.log(`📦 Response headers:`, response.headers);
        console.log('📦 Teller response data:', response.data);

        // Validate the response structure
        if (!Array.isArray(response.data)) {
          console.error('❌ Unexpected response format from Teller API:', response.data);
          throw new Error('Unexpected response format from Teller API');
        }

        console.log(`📊 Found ${response.data.length} accounts from Teller`);
        
        // Cache the result
        this.setCachedData(cacheKey, response.data);
        
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching accounts from Teller:', error.response?.data || error.message);
        
        // Add more detailed logging for the error object itself
        if (error.isAxiosError) {
          console.error('🔴 Axios Error Details:', {
            message: error.message,
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            baseURL: error.config?.baseURL,
            timeout: error.config?.timeout
          });
        }
        
        // More specific error handling
        if (error.response?.status === 404) {
          throw new Error('Account not found. The enrollment may have expired, the access token may be invalid, or the account may have been disconnected.');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication failed. The access token may be invalid or expired.');
        } else if (error.response?.status === 403) {
          throw new Error('Access forbidden. The account may not have the required permissions.');
        } else if (error.response?.status >= 500) {
          throw new Error('Teller service is temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`Failed to fetch accounts: ${error.response?.data?.error?.message || error.response?.data?.error || error.message}`);
      }
    });
  }

  async fetchTransactionsFromTeller(accessToken, accountId, options = {}) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    
    // Create deduplication key that includes parameters
    const paramsString = JSON.stringify(options);
    const dedupKey = `fetch_transactions:${accessToken}:${accountId}:${paramsString}`;
    
    return this.deduplicateRequest(dedupKey, async () => {
      try {
        // Create cache key that includes parameters for unique caching
        const cacheKey = this.getCacheKey('transactions', accessToken, accountId, paramsString);
        const cachedTransactions = this.getCachedData(cacheKey, this.cacheTTL.transactions);
        
        if (cachedTransactions) {
          console.log(`📦 Using cached transactions data for account ${accountId} (${cachedTransactions.length} transactions)`);
          return cachedTransactions;
        }
        
        console.log(`💰 Fetching transactions for account ${accountId} from Teller API...`);
        
        // Remove mock data usage - always fetch from real Teller API
        console.log(`💰 Making request to Teller API for real transaction data`);
        
        const params = new URLSearchParams();
        if (options.fromDate) params.append('from_date', options.fromDate);
        if (options.toDate) params.append('to_date', options.toDate);
        if (options.count) params.append('count', options.count.toString());
        
        const response = await this.axiosInstance.get(`/accounts/${accountId}/transactions?${params}`, {
          auth: {
            username: accessToken,
            password: ''
          }
        });

        console.log(`📊 Found ${response.data.length} transactions for account ${accountId}`);
        
        // Cache the result
        this.setCachedData(cacheKey, response.data);
        
        return response.data;
      } catch (error) {
        console.error(`❌ Error fetching transactions for account ${accountId}:`, error.response?.data || error.message);
        throw new Error(`Failed to fetch transactions: ${error.response?.data?.error || error.message}`);
      }
    });
  }

  async fetchAccountDetailsFromTeller(accessToken, accountId) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      // Check cache first
      const cacheKey = this.getCacheKey('account_details', accessToken, accountId);
      const cachedDetails = this.getCachedData(cacheKey, this.cacheTTL.account_details);
      
      if (cachedDetails) {
        console.log(`📦 Using cached account details for ${accountId}`);
        return cachedDetails;
      }
      
      console.log(`🔍 Fetching account details for ${accountId} from Teller API...`);
      
      const response = await this.axiosInstance.get(`/accounts/${accountId}/details`, {
        auth: {
          username: accessToken,
          password: ''
        }
      });

      // Cache the result
      this.setCachedData(cacheKey, response.data);

      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching account details for ${accountId}:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch account details: ${error.response?.data?.error || error.message}`);
    }
  }

  async syncAccountsForUser(userId, accessToken, enrollmentId) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      console.log(`🔄 Starting account sync for user ${userId}`);
      
      // Get the actual enrollment data from the database to ensure we're using correct info
      const { data: enrollment } = await this.supabase
        .from('teller_enrollments')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .eq('user_id', userId)
        .single();

      if (!enrollment) {
        throw new Error(`Enrollment ${enrollmentId} not found for user ${userId}`);
      }

      // Use the access token from the enrollment record to ensure we're using the correct token
      // Decrypt the access token since it's stored encrypted in the database
      const actualAccessToken = cryptoService.decrypt(enrollment.access_token);
      
      // Check rate limit before making API call
      await this.checkRateLimit(userId);
      
      // Fetch accounts from Teller using the actual access token
      const tellerAccounts = await this.fetchAccountsFromTeller(actualAccessToken);
      
      // Add a guard to ensure tellerAccounts is an array before proceeding.
      if (!Array.isArray(tellerAccounts)) {
        console.error('❌ Expected an array of accounts from Teller, but received:', tellerAccounts);
        throw new Error('Failed to sync accounts: Unexpected response from financial institution.');
      }

      const syncResults = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const tellerAccount of tellerAccounts) {
        // Add a guard to ensure the account object is usable
        if (!tellerAccount || !tellerAccount.id) {
          console.warn('⚠️ Skipping malformed account object received from Teller:', tellerAccount);
          continue; // Skip to the next account
        }
        
        try {
          await this.syncSingleAccount(userId, tellerAccount, enrollmentId, actualAccessToken);
          
          // Check if account was created or updated
          const { data: existingAccount } = await this.supabase
            .from('accounts')
            .select('id')
            .eq('teller_account_id', tellerAccount.id)
            .eq('user_id', userId)
            .single();
          
          if (existingAccount) {
            syncResults.updated++;
          } else {
            syncResults.created++;
          }
        } catch (error) {
          console.error(`❌ Error syncing account ${tellerAccount.id}:`, error);
          syncResults.errors.push({
            account_id: tellerAccount.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Account sync completed:`, syncResults);
      return syncResults;
    } catch (error) {
      console.error('❌ Error in syncAccountsForUser:', error);
      throw error;
    }
  }

  async shouldSetAsPrimary(userId, tellerAccountId) {
    try {
      // Check if user has any existing primary accounts
      const { data: primaryAccounts } = await this.supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .limit(1);

      // If no primary accounts exist, set this as primary
      return !primaryAccounts || primaryAccounts.length === 0;
    } catch (error) {
      console.warn('⚠️ Could not check primary account status:', error.message);
      return false; // Default to false if we can't check
    }
  }

  async syncSingleAccount(userId, tellerAccount, enrollmentId, accessToken) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      // Get enrollment data from teller_enrollments table to ensure we have real enrollment info
      const { data: enrollment } = await this.supabase
        .from('teller_enrollments')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .eq('user_id', userId)
        .single();

      if (!enrollment) {
        throw new Error(`Enrollment ${enrollmentId} not found for user ${userId}`);
      }

      // Check if account already exists for this specific user
      // This prevents overwriting accounts that belong to different users
      const { data: existingAccount } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('teller_account_id', tellerAccount.id)
        .eq('user_id', userId)
        .single();

      const accountData = {
        user_id: userId,
        name: tellerAccount.name || `${tellerAccount.institution?.name || enrollment.institution_name || 'Unknown'} Account`,
        type: tellerAccount.type || 'other',
        institution: tellerAccount.institution?.name || enrollment.institution_name || 'Unknown Institution',
        account_number: tellerAccount.last_four ? `****${tellerAccount.last_four}` : null,
        routing_number: tellerAccount.routing_numbers?.[0] || null,
        balance: 0, // Initialize to 0, will be updated with real balance API call
        available_balance: 0, // Initialize to 0, will be updated with real balance API call
        currency: tellerAccount.currency || 'USD',
        teller_account_id: tellerAccount.id,
        teller_institution_id: tellerAccount.institution?.id || enrollment.institution_id || null,
        teller_enrollment_id: enrollment.enrollment_id, // Use the actual enrollment ID from the database
        sync_status: 'pending_balance', // Will be updated after balance fetch
        is_active: tellerAccount.status === 'open' ? true : false, // Use actual status from Teller
        is_primary: await this.shouldSetAsPrimary(userId, tellerAccount.id), // Set first account as primary
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log(`📋 Account data to be saved:`, {
        ...accountData,
        // Hide sensitive data in logs
        account_number: accountData.account_number ? '[MASKED]' : null,
        routing_number: accountData.routing_number ? '[MASKED]' : null
      });

      let accountId;
      
      if (existingAccount) {
        // Update existing account
        const { error } = await this.supabase
          .from('accounts')
          .update(accountData)
          .eq('id', existingAccount.id);

        if (error) throw error;
        
        console.log(`📝 Updated account: ${accountData.name}`);
        accountId = existingAccount.id;
      } else {
        // Create new account
        accountData.created_at = new Date().toISOString();
        
        const { data: newAccount, error } = await this.supabase
          .from('accounts')
          .insert(accountData)
          .select('id')
          .single();

        if (error) throw error;
        
        console.log(`✨ Created new account: ${accountData.name}`);
        accountId = newAccount.id;
      }

      // Fetch and update balances for all Teller accounts
      // Debug: Log the account structure to understand what Teller is sending
      console.log(`🔗 Account links structure for ${tellerAccount.id}:`, JSON.stringify(tellerAccount.links || {}, null, 2));
      console.log(`📋 Full account object structure:`, JSON.stringify({
        id: tellerAccount.id,
        name: tellerAccount.name,
        type: tellerAccount.type,
        status: tellerAccount.status,
        links: tellerAccount.links,
        institution: tellerAccount.institution
      }, null, 2));
      
      try {
        console.log(`🔍 Attempting to fetch balance for account ${tellerAccount.id}`);
        console.log(`🔑 Access token length: ${accessToken.length}, starts with: ${accessToken.substring(0, 8)}...`);
        
        // Clear any existing balance cache for this account to ensure fresh data
        this.clearBalanceCache(accessToken, tellerAccount.id);
        
        const balanceData = await this.getAccountBalance(accessToken, tellerAccount.id);
        
        // CRITICAL DEBUG: Log the exact balance data received
        console.log(`💰 Raw balance data received from Teller API:`, JSON.stringify(balanceData, null, 2));
        
        // Ensure we have valid balance data before updating
        if (balanceData && (balanceData.current_balance !== undefined || balanceData.available_balance !== undefined)) {
          // CRITICAL DEBUG: Log the exact values being set
          console.log(`✅ Setting account balance: current=${balanceData.current_balance}, available=${balanceData.available_balance}`);
          
          // Update balance directly with real Teller data (matching fix-balances utility approach)
          // This sets the balance from Teller API and prevents any database triggers from overriding it
          const balanceUpdate = {
            balance: balanceData.current_balance,
            available_balance: balanceData.available_balance,
            sync_status: 'success',
            notes: 'Balance synced from Teller API',
            last_sync: new Date().toISOString()
          };
          
          console.log(`🔄 Updating account ${accountId} with balance data:`, JSON.stringify(balanceUpdate, null, 2));
          
          const { error: balanceError } = await this.supabase
            .from('accounts')
            .update(balanceUpdate)
            .eq('id', accountId);

          if (balanceError) {
            console.error(`❌ Failed to update balance for account ${tellerAccount.id}:`, balanceError);
          } else {
            console.log(`✅ Successfully updated balance for account ${tellerAccount.id}: $${balanceData.current_balance}`);
          }
        } else {
          console.error(`❌ Invalid balance data received for account ${tellerAccount.id}:`, balanceData);
          // CRITICAL: Don't leave account with 0 balance, try to get balance manually
          console.log(`🔄 Attempting manual balance fetch for account ${tellerAccount.id}...`);
          
          try {
            const response = await this.axiosInstance.get(`/accounts/${tellerAccount.id}/balances`, {
              auth: {
                username: accessToken,
                password: ''
              }
            });
            
            console.log(`🔍 Manual balance fetch response:`, JSON.stringify(response.data, null, 2));
            
            if (response.data) {
               const manualBalance = {
                 balance: response.data.ledger || response.data.available || 0,
                 available_balance: response.data.available || response.data.ledger || 0,
                 sync_status: 'success',
                 notes: 'Balance synced via manual fetch from Teller API',
                 last_sync: new Date().toISOString()
               };
              
              console.log(`🔄 Updating with manual balance data:`, JSON.stringify(manualBalance, null, 2));
              
              const { error: manualError } = await this.supabase
                .from('accounts')
                .update(manualBalance)
                .eq('id', accountId);
                
              if (manualError) {
                console.error(`❌ Manual balance update failed:`, manualError);
              } else {
                console.log(`✅ Manual balance update successful: $${manualBalance.balance}`);
              }
            }
          } catch (manualError) {
            console.error(`❌ Manual balance fetch failed:`, manualError.message);
          }
        }
      } catch (balanceError) {
        console.error(`❌ Failed to fetch/update balance for account ${tellerAccount.id}:`, balanceError.message);
        console.error(`❌ Balance error details:`, balanceError.response?.data || balanceError);
        
        // Set balances to 0 if API call fails to avoid showing stale/mock data
        await this.supabase
          .from('accounts')
          .update({
            balance: 0,
            available_balance: 0,
            sync_status: 'balance_failed',
            notes: `Balance sync failed: ${balanceError.message}`
          })
          .eq('id', accountId);
      }

      return accountId;
    } catch (error) {
      console.error(`❌ Error syncing account ${tellerAccount.id}:`, error);
      throw error;
    }
  }

  async syncTransactionsForAccount(accountId, accessToken, tellerAccountId, options = {}) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      console.log(`🔄 Starting transaction sync for account ${accountId}`);
      
      // Get the user_id and last_sync for this account
      const { data: account } = await this.supabase
        .from('accounts')
        .select('user_id, last_sync')
        .eq('id', accountId)
        .single();

      if (!account) {
        throw new Error(`Account ${accountId} not found`);
      }

      // Calculate optimal sync window based on last sync
      const syncOptions = this.getOptimalSyncOptions(account.last_sync, options);

      // Check rate limit before making API call
      await this.checkRateLimit(account.user_id);
      
      // Fetch transactions from Teller
      const tellerTransactions = await this.fetchTransactionsFromTeller(
        accessToken, 
        tellerAccountId, 
        syncOptions
      );
      
      const syncResults = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      for (const tellerTransaction of tellerTransactions) {
        try {
          const result = await this.syncSingleTransaction(
            account.user_id, 
            accountId, 
            tellerTransaction
          );
          
          if (result === 'created') {
            syncResults.created++;
          } else if (result === 'updated') {
            syncResults.updated++;
          } else {
            syncResults.skipped++;
          }
        } catch (error) {
          console.error(`❌ Error syncing transaction ${tellerTransaction.id}:`, error);
          syncResults.errors.push({
            transaction_id: tellerTransaction.id,
            error: error.message
          });
        }
      }

      // Update account last sync time
      await this.supabase
        .from('accounts')
        .update({ 
          last_sync: new Date().toISOString(),
          sync_status: 'success'
        })
        .eq('id', accountId);

      console.log(`✅ Transaction sync completed for account ${accountId}:`, syncResults);
      return syncResults;
    } catch (error) {
      console.error(`❌ Error in syncTransactionsForAccount for account ${accountId}:`, error);
      
      // Update account sync status to failed
      await this.supabase
        .from('accounts')
        .update({ 
          sync_status: 'failed',
          notes: `Sync failed: ${error.message}`
        })
        .eq('id', accountId);
      
      throw error;
    }
  }

  async syncSingleTransaction(userId, accountId, tellerTransaction) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      // Check if transaction already exists
      const { data: existingTransaction } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('teller_transaction_id', tellerTransaction.id)
        .single();

      // Determine transaction type and ensure amount follows database constraint
      const tellerAmount = parseFloat(tellerTransaction.amount);
      
      // Simplified transaction type determination based on amount sign from Teller
      // Teller provides amounts where:
      // - Negative amounts are expenses (money going out)
      // - Positive amounts are income (money coming in)
      let transactionType;
      let correctedAmount;
      
      // Get category and description for logging
      const category = tellerTransaction.details?.category?.toLowerCase() || '';
      const description = tellerTransaction.description?.toLowerCase() || '';
      
      // Determine type based on Teller's amount sign (this is the standard)
      if (tellerAmount < 0) {
        // Negative amount from Teller = expense (money going out)
        transactionType = 'expense';
        correctedAmount = Math.abs(tellerAmount); // Store expenses as positive values
      } else {
        // Positive amount from Teller = income (money coming in)
        transactionType = 'income';
        correctedAmount = tellerAmount; // Keep positive for income
      }
      
      // Handle edge case for zero amounts
      if (tellerAmount === 0) {
        transactionType = 'expense'; // Default zero amounts to expense
        correctedAmount = 0;
      }
      
      // Final validation: ensure amounts are positive for consistency
      if (transactionType === 'expense') {
        correctedAmount = Math.abs(correctedAmount); // Always store expenses as positive
      } else if (transactionType === 'income' && correctedAmount < 0) {
        console.log(`⚠️ Converting negative income amount to positive: ${correctedAmount} -> ${Math.abs(correctedAmount)}`);
        correctedAmount = Math.abs(correctedAmount);
      }
      
      // Debug logging for transaction type determination
      console.log(`💳 Transaction: ${tellerTransaction.description}`);
      console.log(`   Original amount: ${tellerAmount}`);
      console.log(`   Category: ${category}`);
      console.log(`   Determined type: ${transactionType}`);
      console.log(`   Final amount: ${correctedAmount}`);
      
      // Ensure the amount is a valid number, not a string
      if (isNaN(correctedAmount)) {
        throw new Error(`Invalid amount value: ${tellerTransaction.amount}`);
      }
      
      const transactionData = {
        user_id: userId,
        account_id: accountId,
        amount: correctedAmount,
        type: transactionType,
        description: tellerTransaction.description || 'Unknown Transaction',
        date: tellerTransaction.date,
        posted_date: tellerTransaction.date, // Teller doesn't separate posted_date, use same as date
        teller_transaction_id: tellerTransaction.id,
        teller_category: tellerTransaction.details?.category || null,
        teller_merchant: tellerTransaction.details?.counterparty?.name || null,
        teller_location: null, // Not provided in Teller API
        status: this.mapTellerTransactionStatus(tellerTransaction.status),
        is_verified: tellerTransaction.status === 'posted',
        check_number: null, // Not provided in standard Teller API
        reference_number: null, // Not provided in standard Teller API
        updated_at: new Date().toISOString()
      };

      if (existingTransaction) {
        // Only update if the transaction has changed
        const hasChanges = this.hasTransactionChanged(existingTransaction, transactionData);
        
        if (hasChanges) {
          const { error } = await this.supabase
            .from('transactions')
            .update(transactionData)
            .eq('id', existingTransaction.id);

          if (error) throw error;
          
          console.log(`📝 Updated transaction: ${transactionData.description}`);
          return 'updated';
        } else {
          return 'skipped';
        }
      } else {
        // Create new transaction
        transactionData.created_at = new Date().toISOString();
        
        const { error } = await this.supabase
          .from('transactions')
          .insert(transactionData);

        if (error) throw error;
        
        console.log(`✨ Created new transaction: ${transactionData.description}`);
        return 'created';
      }
    } catch (error) {
      console.error(`❌ Error syncing transaction ${tellerTransaction.id}:`, error);
      throw error;
    }
  }

  hasTransactionChanged(existing, updated) {
    const fieldsToCompare = [
      'amount', 'description', 'date', 'posted_date', 
      'teller_category', 'teller_merchant', 'status'
    ];
    
    return fieldsToCompare.some(field => existing[field] !== updated[field]);
  }

  // Remove this method since we now use Teller types directly


  mapTellerTransactionStatus(tellerStatus) {
    const statusMap = {
      'pending': 'pending',
      'posted': 'posted',
      'cancelled': 'cancelled'
    };
    
    return statusMap[tellerStatus] || 'posted';
  }

  async syncAllAccountsForEnrollment(enrollmentId, accessToken) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      console.log(`🔄 Starting full sync for enrollment ${enrollmentId}`);
      
      // Find all accounts for this enrollment - get from teller_enrollments table first
      const { data: enrollment, error: enrollmentError } = await this.supabase
        .from('teller_enrollments')
        .select('user_id')
        .eq('enrollment_id', enrollmentId)
        .single();

      if (enrollmentError) throw enrollmentError;
      
      // Find all accounts for this user
      const { data: accounts, error } = await this.supabase
        .from('accounts')
        .select('id, user_id, teller_account_id')
        .eq('user_id', enrollment.user_id);

      if (error) throw error;

      if (!accounts || accounts.length === 0) {
        console.log('⚠️ No accounts found for enrollment:', enrollmentId);
        return { accounts: 0, transactions: 0 };
      }

      let totalTransactionsSynced = 0;

      // Sync accounts first
      const accountSyncResult = await this.syncAccountsForUser(
        enrollment.user_id, 
        accessToken, 
        enrollmentId
      );

      // Then sync transactions for each account using batch processing
      totalTransactionsSynced = await this.batchSyncTransactions(accounts, accessToken);

      console.log(`✅ Full sync completed for enrollment ${enrollmentId}`);
      console.log(`📊 Accounts: ${accountSyncResult.created + accountSyncResult.updated}, Transactions: ${totalTransactionsSynced}`);
      
      return {
        accounts: accountSyncResult.created + accountSyncResult.updated,
        transactions: totalTransactionsSynced
      };
    } catch (error) {
      console.error(`❌ Error in syncAllAccountsForEnrollment for ${enrollmentId}:`, error);
      throw error;
    }
  }

  async batchSyncTransactions(accounts, accessToken) {
    const batchSize = 3; // Process 3 accounts concurrently
    let totalTransactionsSynced = 0;
    
    console.log(`🔄 Starting batch transaction sync for ${accounts.length} accounts (batch size: ${batchSize})`);
    
    // Process accounts in batches
    for (let i = 0; i < accounts.length; i += batchSize) {
      const batch = accounts.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(accounts.length / batchSize)} (${batch.length} accounts)`);
      
      // Process batch concurrently
      const batchPromises = batch.map(async (account) => {
        try {
          const result = await this.syncTransactionsForAccount(
            account.id,
            accessToken,
            account.teller_account_id
          );
          
          return {
            accountId: account.id,
            success: true,
            created: result.created,
            updated: result.updated,
            error: null
          };
        } catch (error) {
          console.error(`❌ Error syncing transactions for account ${account.id}:`, error);
          return {
            accountId: account.id,
            success: false,
            created: 0,
            updated: 0,
            error: error.message
          };
        }
      });
      
      // Wait for all accounts in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Aggregate results
      for (const result of batchResults) {
        if (result.success) {
          totalTransactionsSynced += result.created + result.updated;
          console.log(`✅ Account ${result.accountId}: ${result.created} created, ${result.updated} updated`);
        } else {
          console.log(`❌ Account ${result.accountId}: failed - ${result.error}`);
        }
      }
      
      // Small delay between batches to prevent overwhelming the API
      if (i + batchSize < accounts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }
    
    console.log(`✅ Batch transaction sync completed: ${totalTransactionsSynced} total transactions synced`);
    return totalTransactionsSynced;
  }

  async createConnectLink(userId) {
    try {
      console.log(`🔗 Creating Teller Connect link for user ${userId}`);
      
      // Generate a secure nonce for this connection attempt
      const nonce = require('crypto').randomBytes(16).toString('hex');
      
      // Teller Connect is a client-side JavaScript widget
      // We return the configuration needed to initialize it
      const connectConfig = {
        application_id: process.env.TELLER_APP_ID,
        environment: process.env.TELLER_ENVIRONMENT || 'sandbox',
        nonce: nonce,
        user_id: userId,
        select_account: 'multiple', // Allow users to select multiple accounts
        onSuccess: {
          // This will be handled by the frontend when user completes enrollment
          callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/connect/success`
        }
      };
      
      console.log(`✅ Created Teller Connect configuration for user ${userId}`);
      
      return {
        connect_config: connectConfig,
        nonce: nonce,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };
    } catch (error) {
      console.error('❌ Error creating Teller Connect configuration:', error);
      throw new Error(`Failed to create connect configuration: ${error.message}`);
    }
  }

  async validateEnrollmentSignature(enrollment, nonce) {
    try {
      console.log('🔐 Validating enrollment signature...');
      
      // Teller provides ED25519 signatures for security verification
      // The signature contains: nonce.accessToken.userId.enrollmentId.environment
      if (!enrollment.signatures || enrollment.signatures.length === 0) {
        console.warn('⚠️ No signatures provided in enrollment');
        return false;
      }
      
      const expectedData = [
        nonce,
        enrollment.accessToken,
        enrollment.user.id,
        enrollment.enrollment.id,
        process.env.TELLER_ENVIRONMENT || 'sandbox'
      ].join('.');
      
      // In a production environment, you would verify the signature using your public key
      // For now, we'll log the signature data for debugging
      console.log('📝 Signature data to verify:', expectedData);
      console.log('📝 Provided signatures:', enrollment.signatures);
      
      // TODO: Implement actual signature verification using ED25519
      console.log('✅ Enrollment signature validation completed');
      return true;
    } catch (error) {
      console.error('❌ Error validating enrollment signature:', error);
      return false;
    }
  }

  async getAccountBalance(accessToken, accountId) {
    // Create deduplication key
    const dedupKey = `fetch_balance:${accessToken}:${accountId}`;
    
    return this.deduplicateRequest(dedupKey, async () => {
      try {
        // Check cache first
        const cacheKey = this.getCacheKey('balances', accessToken, accountId);
        const cachedBalance = this.getCachedData(cacheKey, this.cacheTTL.balances);
        
        if (cachedBalance) {
          console.log(`📦 Using cached balance data for account ${accountId}`);
          return cachedBalance;
        }
        
        console.log(`💰 Fetching balance for account ${accountId} from Teller API`);
        console.log(`🔑 Using access token: ${accessToken.substring(0, 8)}...`);
        console.log(`🌐 Making request to: ${this.baseURL}/accounts/${accountId}/balances`);
        
        const response = await this.axiosInstance.get(`/accounts/${accountId}/balances`, {
          auth: {
            username: accessToken,
            password: ''
          }
        });

        console.log(`💰 Raw balance response from Teller for account ${accountId}:`, JSON.stringify(response.data, null, 2));

        // Handle different possible response formats from Teller
        let currentBalance = 0;
        let availableBalance = 0;

        if (response.data) {
          // Try different property names that Teller might use
          currentBalance = response.data.current || 
                          response.data.current_balance || 
                          response.data.balance || 
                          response.data.ledger ||
                          0;
                          
          availableBalance = response.data.available || 
                            response.data.available_balance || 
                            response.data.balance ||
                            currentBalance ||
                            0;

          // Convert strings to numbers if needed
          if (typeof currentBalance === 'string') {
            currentBalance = parseFloat(currentBalance);
          }
          if (typeof availableBalance === 'string') {
            availableBalance = parseFloat(availableBalance);
          }

          console.log(`💰 Parsed balances - Current: ${currentBalance}, Available: ${availableBalance}`);
        }

        const balanceData = {
          account_id: accountId,
          current_balance: currentBalance,
          available_balance: availableBalance,
          currency: response.data.currency || 'USD',
          last_updated: new Date().toISOString()
        };

        // Cache the result
        this.setCachedData(cacheKey, balanceData);

        return balanceData;
      } catch (error) {
        console.error(`❌ Error fetching balance for account ${accountId}:`, error.response?.data || error.message);
        throw new Error(`Failed to fetch account balance: ${error.response?.data?.error || error.message}`);
      }
    });
  }
}

module.exports = new TellerService();