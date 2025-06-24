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

  async fetchAccountsFromTeller(accessToken) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      console.log('🏦 Fetching accounts from Teller API...');
      
      const response = await this.axiosInstance.get('/accounts', {
        auth: {
          username: accessToken,
          password: ''
        }
      });

      console.log(`📊 Found ${response.data.length} accounts from Teller`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching accounts from Teller:', error.response?.data || error.message);
      throw new Error(`Failed to fetch accounts: ${error.response?.data?.error || error.message}`);
    }
  }

  async fetchTransactionsFromTeller(accessToken, accountId, options = {}) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      console.log(`💰 Fetching transactions for account ${accountId} from Teller API...`);
      
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
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching transactions for account ${accountId}:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch transactions: ${error.response?.data?.error || error.message}`);
    }
  }

  async fetchAccountDetailsFromTeller(accessToken, accountId) {
    if (!this.supabase) throw new Error('Supabase client is not initialized');
    try {
      console.log(`🔍 Fetching account details for ${accountId} from Teller API...`);
      
      const response = await this.axiosInstance.get(`/accounts/${accountId}/details`, {
        auth: {
          username: accessToken,
          password: ''
        }
      });

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
      
      // Fetch accounts from Teller
      const tellerAccounts = await this.fetchAccountsFromTeller(accessToken);
      
      const syncResults = {
        created: 0,
        updated: 0,
        errors: []
      };

      for (const tellerAccount of tellerAccounts) {
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
      
      // Get the user_id for this account
      const { data: account } = await this.supabase
        .from('accounts')
        .select('user_id')
        .eq('id', accountId)
        .single();

      if (!account) {
        throw new Error(`Account ${accountId} not found`);
      }

      // Default to syncing last 30 days if no date range specified
      const defaultFromDate = new Date();
      defaultFromDate.setDate(defaultFromDate.getDate() - 30);
      
      const syncOptions = {
        fromDate: options.fromDate || defaultFromDate.toISOString().split('T')[0],
        toDate: options.toDate || new Date().toISOString().split('T')[0],
        count: options.count || 1000
      };

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

      // Then sync transactions for each account
      for (const account of accounts) {
        try {
          const transactionSyncResult = await this.syncTransactionsForAccount(
            account.id,
            accessToken,
            account.teller_account_id
          );
          
          totalTransactionsSynced += transactionSyncResult.created + transactionSyncResult.updated;
        } catch (error) {
          console.error(`❌ Error syncing transactions for account ${account.id}:`, error);
        }
      }

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

  async createConnectLink(userId) {
    try {
      console.log(`🔗 Creating Teller Connect link for user ${userId}`);
      
      // Generate a unique enrollment ID for this connection attempt
      const enrollmentId = `enrollment_${userId}_${Date.now()}`;
      
      // In a real implementation, this would create a secure connect session
      // For now, we'll return a mock URL that would be used to initiate Teller Connect
      const connectUrl = `${this.baseURL}/connect?enrollment_id=${enrollmentId}&user_id=${userId}`;
      
      console.log(`✅ Created Teller Connect link: ${connectUrl}`);
      
      return {
        connect_url: connectUrl,
        enrollment_id: enrollmentId,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      };
    } catch (error) {
      console.error('❌ Error creating Teller Connect link:', error);
      throw new Error(`Failed to create connect link: ${error.message}`);
    }
  }

  async exchangeToken(publicToken) {
    try {
      console.log('🔄 Exchanging public token for access token...');
      
      // In a real Teller implementation, this would make an API call to exchange tokens
      // For now, we'll simulate the token exchange process
      const response = await this.axiosInstance.post('/token/exchange', {
        public_token: publicToken
      });
      
      console.log('✅ Successfully exchanged public token');
      
      return {
        access_token: response.data.access_token,
        enrollment_id: response.data.enrollment_id,
        institution: response.data.institution
      };
    } catch (error) {
      console.error('❌ Error exchanging public token:', error.response?.data || error.message);
      throw new Error(`Failed to exchange token: ${error.response?.data?.error || error.message}`);
    }
  }

  async getAccountBalance(accessToken, accountId) {
    try {
      console.log(`💰 Fetching balance for account ${accountId}`);
      
      const response = await this.axiosInstance.get(`/accounts/${accountId}`, {
        auth: {
          username: accessToken,
          password: ''
        }
      });

      return {
        account_id: response.data.id,
        current_balance: parseFloat(response.data.balance),
        available_balance: parseFloat(response.data.available_balance || response.data.balance),
        currency: response.data.currency || 'USD',
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error fetching balance for account ${accountId}:`, error.response?.data || error.message);
      throw new Error(`Failed to fetch account balance: ${error.response?.data?.error || error.message}`);
    }
  }
}

module.exports = new TellerService();