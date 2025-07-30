const tellerService = require('../services/tellerService');
const { getClient, validateData } = require('../utils/database');
const cryptoService = require('../utils/crypto');
const crypto = require('crypto');

class TellerController {
  constructor() {
    this.getAccounts = this.getAccounts.bind(this);
  }

  /**
   * Connect a user's bank account via Teller
   * This would typically be called after the user completes the Teller Connect flow
   */
  async connectAccount(req, res) {
    const { enrollment, nonce } = req.body;
    const userId = req.user.id;
    let enrollmentId = null; // To hold the ID for potential cleanup

    try {
      // Validate required fields
      if (!enrollment || !enrollment.accessToken || !enrollment.enrollment.id) {
        return res.status(400).json({
          error: 'Invalid enrollment object',
          message: 'The enrollment object with accessToken and enrollment.id is required'
        });
      }

      // Additional validation and debugging
      console.log('🔍 Enrollment validation:', {
        hasAccessToken: !!enrollment.accessToken,
        accessTokenPrefix: enrollment.accessToken?.substring(0, 10) + '...',
        hasEnrollmentId: !!enrollment.enrollment?.id,
        enrollmentId: enrollment.enrollment?.id,
        hasInstitution: !!enrollment.enrollment?.institution,
        institutionName: enrollment.enrollment?.institution?.name
      });

      enrollmentId = enrollment.enrollment.id;

      // Verify enrollment signature for security
      if (nonce) {
        const isSignatureValid = await tellerService.validateEnrollmentSignature(enrollment, nonce);
        if (!isSignatureValid) {
          console.warn('⚠️ Enrollment signature validation failed');
          // In production, you might want to reject invalid signatures
          // For now, we'll log the warning and continue
        }
      }

      console.log(`🔗 Storing Teller enrollment for user ${userId}`);
      console.log('📋 Full enrollment object received:', JSON.stringify(enrollment, null, 2));

      // Step 1: Store the enrollment and access token
      const { error: enrollmentError } = await getClient()
        .from('teller_enrollments')
        .upsert({
          user_id: userId,
          enrollment_id: enrollmentId,
          access_token: cryptoService.encrypt(enrollment.accessToken),
          institution_id: enrollment.enrollment.institution.id || null,
          institution_name: enrollment.enrollment.institution.name,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (enrollmentError) {
        // If this initial insert fails, we can just throw the error
        throw enrollmentError;
      }

      // Step 2: Validate access token by testing it before syncing
      console.log('🔍 Testing access token validity...');
      try {
        // Test the access token by making a simple API call
        await tellerService.fetchAccountsFromTeller(enrollment.accessToken);
      } catch (tokenError) {
        console.error('❌ Access token validation failed:', tokenError.message);
        
        // Clean up the enrollment we just created
        await getClient()
          .from('teller_enrollments')
          .delete()
          .eq('enrollment_id', enrollmentId);
        
        return res.status(400).json({
          success: false,
          error: 'Invalid access token',
          message: 'The access token from Teller Connect is invalid or expired. Please try connecting again.',
          details: tokenError.message
        });
      }

      // Step 3: Clear any cached balance data for this user to ensure fresh data
      tellerService.clearCacheForUser(userId);
      
      // Step 4: Sync accounts first (this will handle balance syncing as well)
      const accountSyncResult = await tellerService.syncAccountsForUser(
        userId, 
        enrollment.accessToken,
        enrollmentId
      );

      // Step 5: Sync transactions for all synced accounts
      let transactionSyncResults = {
        total_accounts: 0,
        total_transactions: 0,
        errors: []
      };

      try {
        // Get accounts that were just synced for this enrollment
        const { data: syncedAccounts } = await getClient()
          .from('accounts')
          .select('id, teller_account_id')
          .eq('user_id', userId)
          .eq('teller_enrollment_id', enrollmentId);

        if (syncedAccounts && syncedAccounts.length > 0) {
          console.log(`🔄 Starting transaction sync for ${syncedAccounts.length} accounts (balances already synced)`);
          
          for (const account of syncedAccounts) {
            try {
              // Sync transactions only (balance was already synced in Step 4)
              const transactionResult = await tellerService.syncTransactionsForAccount(
                account.id,
                enrollment.accessToken,
                account.teller_account_id
              );

              transactionSyncResults.total_accounts++;
              transactionSyncResults.total_transactions += transactionResult.created + transactionResult.updated;

              console.log(`💰 Account ${account.id} transaction sync completed: ${transactionResult.created} created, ${transactionResult.updated} updated`);
            } catch (transactionError) {
              console.error(`❌ Error syncing transactions for account ${account.id}:`, transactionError);
              transactionSyncResults.errors.push({
                account_id: account.id,
                type: 'transaction_sync',
                error: transactionError.message
              });
            }
          }
        }
      } catch (transactionSyncError) {
        console.error('❌ Error during transaction sync phase:', transactionSyncError);
        transactionSyncResults.errors.push({
          type: 'general',
          error: transactionSyncError.message
        });
      }

      console.log(`✅ Enrollment sync completed: ${accountSyncResult.created + accountSyncResult.updated} accounts, ${transactionSyncResults.total_transactions} transactions`);

      res.json({
        success: true,
        message: 'Account connected and synced successfully',
        enrollment_id: enrollmentId,
        sync_results: {
          accounts: accountSyncResult,
          transactions: transactionSyncResults
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      // If any step fails, log the specific error and send it back
      console.error('🔴 CONNECT FAILURE:', error);

      // Pseudo-transaction: Attempt to clean up the enrollment if it was created
      if (enrollmentId) {
        try {
          await getClient()
            .from('teller_enrollments')
            .delete()
            .eq('enrollment_id', enrollmentId);
          console.log(`🧼 Cleaned up failed enrollment: ${enrollmentId}`);
        } catch (cleanupError) {
          console.error(`🔴 CLEANUP FAILURE for enrollment ${enrollmentId}:`, cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: error.message || 'An unexpected server error occurred during account connection.'
      });
    }
  }

  /**
   * Helper function to get gradient colors based on account type
   */
  getGradientColors(accountType) {
    const colorMap = {
      'checking': ['#f093fb', '#f5576c'],
      'savings': ['#667eea', '#764ba2'],
      'credit': ['#4facfe', '#00f2fe'],
      'loan': ['#fa709a', '#fee140'],
      'investment': ['#43e97b', '#38f9d7']
    };
    return colorMap[accountType] || ['#667eea', '#764ba2']; // default to savings colors
  }

  async getAccounts(req, res) {
    try {
      const userId = req.user.id;

      const { data: accounts, error } = await getClient()
        .from('accounts')
        .select(`
          id,
          name,
          type,
          institution,
          balance,
          account_number,
          available_balance,
          currency,
          sync_status,
          is_active,
          last_sync,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching accounts:', error);
        return res.status(500).json({
          error: 'Failed to fetch accounts',
          message: error.message
        });
      }

      // Transform accounts to include frontend-required fields
      const transformedAccounts = (accounts || []).map(account => ({
        ...account,
        mask: account.account_number,
        gradientColors: this.getGradientColors(account.type)
      }));

      res.json({
        success: true,
        accounts: transformedAccounts,
        total: transformedAccounts.length
      });

    } catch (error) {
      console.error('❌ Error in getAccounts:', error);
      res.status(500).json({
        error: 'Failed to fetch accounts',
        message: error.message
      });
    }
  }

  /**
   * Get transactions for a specific account
   */
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { accountId } = req.params;
      const { limit = 50, offset = 0, startDate, endDate } = req.query;

      // Verify user owns this account
      const { data: account, error: accountError } = await getClient()
        .from('accounts')
        .select('id, name')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({
          error: 'Account not found',
          message: 'Account does not exist or you do not have access to it'
        });
      }

      // Build query
      let query = getClient()
        .from('transactions')
        .select(`
          id,
          amount,
          type,
          description,
          date,
          posted_date,
          teller_category,
          teller_merchant,
          user_category,
          user_merchant,
          status,
          is_verified,
          created_at
        `)
        .eq('account_id', accountId)
        .order('date', { ascending: false });

      // Add date filters if provided
      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      // Add pagination
      query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      const { data: transactions, error } = await query;

      if (error) {
        console.error('❌ Error fetching transactions:', error);
        return res.status(500).json({
          error: 'Failed to fetch transactions',
          message: error.message
        });
      }

      res.json({
        success: true,
        account: account,
        transactions: transactions || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: transactions ? transactions.length : 0
        }
      });

    } catch (error) {
      console.error('❌ Error in getTransactions:', error);
      res.status(500).json({
        error: 'Failed to fetch transactions',
        message: error.message
      });
    }
  }

  /**
   * Manually sync a specific account
   */
  async syncAccount(req, res) {
    try {
      const userId = req.user.id;
      const { accountId } = req.params;

      // Verify user owns this account and get Teller details
      const { data: account, error: accountError } = await getClient()
        .from('accounts')
        .select('id, name, teller_account_id, teller_enrollment_id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({
          error: 'Account not found',
          message: 'Account does not exist or you do not have access to it'
        });
      }

      if (!account.teller_account_id || !account.teller_enrollment_id) {
        return res.status(400).json({
          error: 'Account not connected to Teller',
          message: 'This account is not connected to Teller and cannot be synced'
        });
      }

      // Get access token for this enrollment
      const { data: enrollment, error: enrollmentError } = await getClient()
        .from('teller_enrollments')
        .select('access_token')
        .eq('enrollment_id', account.teller_enrollment_id)
        .eq('user_id', userId)
        .single();

      if (enrollmentError || !enrollment) {
        return res.status(400).json({
          error: 'Enrollment not found',
          message: 'Could not find valid enrollment for this account'
        });
      }

      // Decrypt the access token
      const decryptedToken = cryptoService.decrypt(enrollment.access_token);

      // Update account status to syncing
      await getClient()
        .from('accounts')
        .update({ 
          sync_status: 'syncing',
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      // Sync transactions for this account
      const syncResult = await tellerService.syncTransactionsForAccount(
        accountId,
        decryptedToken,
        account.teller_account_id
      );

      res.json({
        success: true,
        message: 'Account sync completed',
        account: {
          id: account.id,
          name: account.name
        },
        sync_results: syncResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in syncAccount:', error);
      
      // Update account status to failed
      const { accountId } = req.params;
      await getClient()
        .from('accounts')
        .update({ 
          sync_status: 'failed',
          notes: `Manual sync failed: ${error.message}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      res.status(500).json({
        error: 'Sync failed',
        message: error.message
      });
    }
  }

  /**
   * Disconnect an account (remove from Teller)
   */
  async disconnectAccount(req, res) {
    try {
      const userId = req.user.id;
      const { accountId } = req.params;
      
      if (process.env.NODE_ENV === 'test') {
        console.log('DEBUG: disconnectAccount called with userId:', userId, 'accountId:', accountId);
      }

      // Verify user owns this account
      const { data: account, error: accountError } = await getClient()
        .from('accounts')
        .select('id, name, teller_enrollment_id')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (process.env.NODE_ENV === 'test') {
        console.log('DEBUG: account lookup result:', { account, accountError });
      }

      if (accountError || !account) {
        return res.status(404).json({
          error: 'Account not found',
          message: 'Account does not exist or you do not have access to it'
        });
      }

      // Delete all transactions for this account first
      const { error: deleteTransactionsError } = await getClient()
        .from('transactions')
        .delete()
        .eq('account_id', accountId);

      if (deleteTransactionsError) {
        console.error('❌ Error deleting transactions:', deleteTransactionsError);
        return res.status(500).json({
          error: 'Failed to delete account transactions',
          message: deleteTransactionsError.message
        });
      }

      // Delete the account from database
      const { error: deleteAccountError } = await getClient()
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (deleteAccountError) {
        console.error('❌ Error deleting account:', deleteAccountError);
        return res.status(500).json({
          error: 'Failed to delete account',
          message: deleteAccountError.message
        });
      }

      // Check if this was the last account for this enrollment
      const { data: remainingAccounts, error: remainingError } = await getClient()
        .from('accounts')
        .select('id')
        .eq('teller_enrollment_id', account.teller_enrollment_id);

      // If no remaining accounts, delete the enrollment
      if (!remainingError && (!remainingAccounts || remainingAccounts.length === 0)) {
        await getClient()
          .from('teller_enrollments')
          .delete()
          .eq('enrollment_id', account.teller_enrollment_id);
      }

      res.json({
        success: true,
        message: 'Account disconnected and deleted successfully',
        account: {
          id: account.id,
          name: account.name
        }
      });

    } catch (error) {
      console.error('❌ Error in disconnectAccount:', error);
      res.status(500).json({
        error: 'Failed to disconnect account',
        message: error.message
      });
    }
  }

  /**
   * Get sync status for all user accounts
   */
  async getSyncStatus(req, res) {
    try {
      const userId = req.user.id;

      const { data: accounts, error } = await getClient()
        .from('accounts')
        .select(`
          id,
          name,
          institution,
          sync_status,
          verification_status,
          last_sync,
          is_active,
          notes
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error fetching sync status:', error);
        return res.status(500).json({
          error: 'Failed to fetch sync status',
          message: error.message
        });
      }

      // Calculate summary statistics
      const summary = {
        total: accounts ? accounts.length : 0,
        active: accounts ? accounts.filter(a => a.is_active).length : 0,
        syncing: accounts ? accounts.filter(a => a.sync_status === 'syncing').length : 0,
        failed: accounts ? accounts.filter(a => a.sync_status === 'failed').length : 0,
        last_sync: accounts ? Math.max(...accounts.map(a => new Date(a.last_sync || 0).getTime())) : null
      };

      res.json({
        success: true,
        summary,
        accounts: accounts || []
      });

    } catch (error) {
      console.error('❌ Error in getSyncStatus:', error);
      res.status(500).json({
        error: 'Failed to fetch sync status',
        message: error.message
      });
    }
  }

  /**
   * Create a Teller Connect link for the user
   */
  async createConnectLink(req, res) {
    try {
      const userId = req.user.id;

      const connectData = await tellerService.createConnectLink(userId);

      res.json({
        success: true,
        ...connectData
      });

    } catch (error) {
      console.error('❌ Error in createConnectLink:', error);
      res.status(500).json({
        error: 'Failed to create connect link',
        message: error.message
      });
    }
  }

  /**
   * Get enrollment configuration for Teller Connect
   */
  async getConnectConfig(req, res) {
    try {
      const userId = req.user.id;

      const connectData = await tellerService.createConnectLink(userId);

      res.json({
        success: true,
        ...connectData
      });

    } catch (error) {
      console.error('❌ Error in getConnectConfig:', error);
      res.status(500).json({
        error: 'Failed to get connect configuration',
        message: error.message
      });
    }
  }

  /**
   * Get account balance for a specific account
   */
  async getAccountBalance(req, res) {
    try {
      const userId = req.user.id;
      const { accountId } = req.params;

      // Verify user owns this account and get Teller details
      const { data: account, error: accountError } = await getClient()
        .from('accounts')
        .select(`
          id, 
          name, 
          balance,
          available_balance,
          currency,
          teller_account_id, 
          teller_enrollment_id,
          last_sync
        `)
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (accountError || !account) {
        return res.status(404).json({
          error: 'Account not found',
          message: 'Account does not exist or you do not have access to it'
        });
      }

      // Return cached balance if recent sync (within 5 minutes)
      const lastSync = new Date(account.last_sync);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      if (lastSync > fiveMinutesAgo) {
        return res.json({
          success: true,
          account_id: account.id,
          current_balance: account.balance,
          available_balance: account.available_balance,
          currency: account.currency || 'USD',
          last_updated: account.last_sync,
          cached: true
        });
      }

      // If we need fresh data and have Teller integration
      if (account.teller_account_id && account.teller_enrollment_id) {
        // Get access token for this enrollment
        const { data: enrollment, error: enrollmentError } = await getClient()
          .from('teller_enrollments')
          .select('access_token')
          .eq('enrollment_id', account.teller_enrollment_id)
          .eq('user_id', userId)
          .single();

        if (!enrollmentError && enrollment) {
          try {
            const decryptedToken = cryptoService.decrypt(enrollment.access_token);
            const balanceData = await tellerService.getAccountBalance(
              decryptedToken,
              account.teller_account_id
            );

            // Update local balance
            await getClient()
              .from('accounts')
              .update({
                balance: balanceData.current_balance,
                available_balance: balanceData.available_balance,
                last_sync: new Date().toISOString()
              })
              .eq('id', accountId);

            return res.json({
              success: true,
              ...balanceData,
              account_id: account.id,
              cached: false
            });
          } catch (tellerError) {
            console.warn('⚠️ Failed to get fresh balance from Teller, using cached:', tellerError.message);
          }
        }
      }

      // Fallback to cached balance
      res.json({
        success: true,
        account_id: account.id,
        current_balance: account.balance,
        available_balance: account.available_balance,
        currency: account.currency || 'USD',
        last_updated: account.last_sync,
        cached: true
      });

    } catch (error) {
      console.error('❌ Error in getAccountBalance:', error);
      res.status(500).json({
        error: 'Failed to get account balance',
        message: error.message
      });
    }
  }

  /**
   * Generate a secure nonce for Teller Connect
   */
  async generateNonce(req, res) {
    try {
      const nonce = crypto.randomBytes(16).toString('hex');
      // TODO: Store this nonce server-side, associated with the user's session,
      // with a short expiry (e.g., 5 minutes) to be used for signature verification.
      res.json({ success: true, nonce });
    } catch (error) {
      console.error('❌ Error generating nonce:', error);
      res.status(500).json({
        error: 'Failed to generate nonce',
        message: error.message
      });
    }
  }

  /**
   * Manually trigger sync for the current user
   */
  async triggerUserSync(req, res) {
    try {
      const userId = req.user.id;
      const syncService = require('../services/syncService');

      console.log(`🔄 Manual sync triggered for user ${userId}`);
      
      const result = await syncService.syncUser(userId);

      res.json({
        success: true,
        message: 'User sync completed successfully',
        sync_results: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in triggerUserSync:', error);
      res.status(500).json({
        error: 'Failed to trigger user sync',
        message: error.message
      });
    }
  }

  /**
   * Get background sync service status
   */
  async getSyncServiceStatus(req, res) {
    try {
      const syncService = require('../services/syncService');
      const status = syncService.getStatus();

      res.json({
        success: true,
        sync_service: status
      });

    } catch (error) {
      console.error('❌ Error in getSyncServiceStatus:', error);
      res.status(500).json({
        error: 'Failed to get sync service status',
        message: error.message
      });
    }
  }
}

module.exports = new TellerController();