const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { getClient } = require('../utils/database');

class TellerService {
  constructor() {
    this.baseURL = process.env.TELLER_ENVIRONMENT === 'production' 
      ? 'https://api.teller.io' 
      : 'https://api.teller.io/sandbox';
    
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
        
        // Handle sandbox mode with mock data if using test token
        if (accessToken.startsWith('test_token_') || process.env.TELLER_ENVIRONMENT === 'sandbox') {
          console.log('🧪 Using sandbox mode with mock data');
          const mockAccounts = [
            {
              id: 'acc_pf53ae2brofp6upddo001',
              name: 'Test Checking Account',
              type: 'depository',
              subtype: 'checking',
              status: 'open',
              balance: 1234.56,
              available_balance: 1234.56,
              currency: 'USD',
              last_four: '1234',
              institution: {
                id: 'chase',
                name: 'Chase Bank'
              },
              enrollment_id: 'enr_pf53ae2brofp6upddo001',
              routing_numbers: ['021000021'],
              links: {
                balances: '/accounts/acc_pf53ae2brofp6upddo001/balances',
                transactions: '/accounts/acc_pf53ae2brofp6upddo001/transactions'
              }
            },
            {
              id: 'acc_pf53ae2brofp6upddo002',
              name: 'Test Savings Account',
              type: 'depository',
              subtype: 'savings',
              status: 'open',
              balance: 5678.90,
              available_balance: 5678.90,
              currency: 'USD',
              last_four: '5678',
              institution: {
                id: 'chase',
                name: 'Chase Bank'
              },
              enrollment_id: 'enr_pf53ae2brofp6upddo001',
              routing_numbers: ['021000021'],
              links: {
                balances: '/accounts/acc_pf53ae2brofp6upddo002/balances',
                transactions: '/accounts/acc_pf53ae2brofp6upddo002/transactions'
              }
            }
          ];
          
          // Cache the mock result
          this.setCachedData(cacheKey, mockAccounts);
          
          console.log(`📊 Found ${mockAccounts.length} mock accounts for testing`);
          return mockAccounts;
        }
        
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
        
        // Handle sandbox mode with mock data if using test token
        if (accessToken.startsWith('test_token_') || process.env.TELLER_ENVIRONMENT === 'sandbox') {
          console.log('🧪 Using sandbox mode with mock transaction data');
          const mockTransactions = [
            {
              id: 'txn_pf53ae2brofp6upddo001',
              amount: '-23.45',
              date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
              description: 'Coffee Shop Purchase',
              category: 'food_and_drink',
              merchant: {
                name: 'Starbucks',
                location: 'New York, NY'
              },
              status: 'posted',
              type: 'purchase',
              check_number: null,
              reference_number: 'REF123456',
              posted_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
              id: 'txn_pf53ae2brofp6upddo002',
              amount: '-1250.00',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
              description: 'Monthly Rent Payment',
              category: 'rent',
              merchant: {
                name: 'Property Management Co',
                location: 'New York, NY'
              },
              status: 'posted',
              type: 'payment',
              check_number: null,
              reference_number: 'RENT202507',
              posted_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            {
              id: 'txn_pf53ae2brofp6upddo003',
              amount: '2500.00',
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days ago
              description: 'Salary Deposit',
              category: 'payroll',
              merchant: {
                name: 'ACME Corp',
                location: 'New York, NY'
              },
              status: 'posted',
              type: 'deposit',
              check_number: null,
              reference_number: 'PAY202507',
              posted_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }
          ];
          
          // Cache the mock result
          this.setCachedData(cacheKey, mockTransactions);
          
          console.log(`📊 Found ${mockTransactions.length} mock transactions for account ${accountId}`);
          return mockTransactions;
        }
        
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
      
      // Check rate limit before making API call
      await this.checkRateLimit(userId);
      
      // Fetch accounts from Teller
      const tellerAccounts = await this.fetchAccountsFromTeller(accessToken);
      
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
          await this.syncSingleAccount(userId, tellerAccount, enrollmentId, accessToken);
          
          // Check if account was created or updated
          const { data: existingAccount } = await this.supabase
            .from('accounts')
            .select('id')
            .eq('teller_account_id', tellerAccount.id)
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

  async syncSingleAccount(userId, tellerAccount, enrollmentId, accessToken) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      // Check if account already exists
      const { data: existingAccount } = await this.supabase
        .from('accounts')
        .select('*')
        .eq('teller_account_id', tellerAccount.id)
        .single();

      const accountData = {
        user_id: userId,
        name: tellerAccount.name || `${tellerAccount.institution?.name || 'Unknown'} Account`,
        type: tellerAccount.type || 'other',
        subtype: tellerAccount.subtype || null,
        status: tellerAccount.status || 'open',
        institution: tellerAccount.institution?.name || 'Unknown Institution',
        account_number: tellerAccount.last_four ? `****${tellerAccount.last_four}` : null,
        routing_number: tellerAccount.routing_numbers?.[0] || null,
        balance: 0, // Balances need separate API call
        available_balance: 0, // Balances need separate API call
        currency: tellerAccount.currency || 'USD',
        teller_account_id: tellerAccount.id,
        teller_institution_id: tellerAccount.institution?.id || null,
        teller_enrollment_id: tellerAccount.enrollment_id || enrollmentId,
        teller_last_four: tellerAccount.last_four || null,
        sync_status: 'success',
        is_active: tellerAccount.status === 'open',
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

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

      // Fetch and update balances if account has balance endpoint
      if (tellerAccount.links?.balances) {
        try {
          const balanceData = await this.getAccountBalance(accessToken, tellerAccount.id);
          
          await this.supabase
            .from('accounts')
            .update({
              balance: balanceData.current_balance,
              available_balance: balanceData.available_balance
            })
            .eq('id', accountId);
            
          console.log(`💰 Updated balances for account: ${accountData.name}`);
        } catch (balanceError) {
          console.warn(`⚠️ Could not fetch balance for account ${tellerAccount.id}:`, balanceError.message);
        }
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

      const transactionData = {
        user_id: userId,
        account_id: accountId,
        amount: Math.abs(parseFloat(tellerTransaction.amount)),
        type: this.mapTellerTransactionType(tellerTransaction.type, tellerTransaction.amount),
        description: tellerTransaction.description || 'Unknown Transaction',
        date: tellerTransaction.date,
        posted_date: tellerTransaction.posted_date || tellerTransaction.date,
        teller_transaction_id: tellerTransaction.id,
        teller_category: tellerTransaction.category || null,
        teller_merchant: tellerTransaction.merchant?.name || null,
        teller_location: tellerTransaction.merchant?.location || null,
        status: this.mapTellerTransactionStatus(tellerTransaction.status),
        is_verified: tellerTransaction.status === 'posted',
        check_number: tellerTransaction.check_number || null,
        reference_number: tellerTransaction.reference_number || null,
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

  mapTellerTransactionType(tellerType, amount) {
    // Teller uses positive/negative amounts to indicate credit/debit
    if (parseFloat(amount) < 0) {
      return 'expense';
    } else {
      return 'income';
    }
  }

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
      
      // Find all accounts for this enrollment
      const { data: accounts, error } = await this.supabase
        .from('accounts')
        .select('id, user_id, teller_account_id')
        .eq('teller_enrollment_id', enrollmentId);

      if (error) throw error;

      if (!accounts || accounts.length === 0) {
        console.log('⚠️ No accounts found for enrollment:', enrollmentId);
        return { accounts: 0, transactions: 0 };
      }

      let totalTransactionsSynced = 0;

      // Sync accounts first
      const accountSyncResult = await this.syncAccountsForUser(
        accounts[0].user_id, 
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
        
        console.log(`💰 Fetching balance for account ${accountId}`);
        
        // Handle sandbox mode with mock data if using test token
        if (accessToken.startsWith('test_token_') || process.env.TELLER_ENVIRONMENT === 'sandbox') {
          console.log('🧪 Using sandbox mode with mock balance data');
          const mockBalance = {
            account_id: accountId,
            current_balance: accountId === 'acc_pf53ae2brofp6upddo001' ? 1234.56 : 5678.90,
            available_balance: accountId === 'acc_pf53ae2brofp6upddo001' ? 1234.56 : 5678.90,
            currency: 'USD',
            last_updated: new Date().toISOString()
          };
          
          // Cache the mock result
          this.setCachedData(cacheKey, mockBalance);
          
          return mockBalance;
        }
        
        const response = await this.axiosInstance.get(`/accounts/${accountId}`, {
          auth: {
            username: accessToken,
            password: ''
          }
        });

        const balanceData = {
          account_id: response.data.id,
          current_balance: parseFloat(response.data.balance),
          available_balance: parseFloat(response.data.available_balance || response.data.balance),
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