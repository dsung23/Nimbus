const tellerService = require('../services/tellerService');
const { getClient, validateData } = require('../utils/database');
const cryptoService = require('../utils/crypto');
const crypto = require('crypto');

class TellerController {
  /**
   * Connect a user's bank account via Teller
   * This would typically be called after the user completes the Teller Connect flow
   */
  async connectAccount(req, res) {
    const { enrollment } = req.body;
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

      enrollmentId = enrollment.enrollment.id;

      // TODO: Verify enrollment signature
      console.log('TODO: Implement Teller enrollment signature verification.');

      console.log(`🔗 Storing Teller enrollment for user ${userId}`);

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

      // Step 2: Sync accounts and transactions
      const syncResult = await tellerService.syncAccountsForUser(
        userId, 
        enrollment.accessToken,
        enrollmentId
      );

      res.json({
        success: true,
        message: 'Account connected and synced successfully',
        enrollment_id: enrollmentId,
        sync_results: syncResult,
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
   * Get all connected accounts for a user
   */
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
          available_balance,
          currency,
          sync_status,
          verification_status,
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

      res.json({
        success: true,
        accounts: accounts || [],
        total: accounts ? accounts.length : 0
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
   * Exchange a public token for an access token
   */
  async exchangeToken(req, res) {
    try {
      const { public_token } = req.body;
      const userId = req.user.id;

      if (!public_token) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'public_token is required'
        });
      }

      const tokenData = await tellerService.exchangeToken(public_token);

      // Store the enrollment
      const { error: enrollmentError } = await getClient()
        .from('teller_enrollments')
        .upsert({
          user_id: userId,
          enrollment_id: tokenData.enrollment_id,
          access_token: cryptoService.encrypt(tokenData.access_token),
          institution_id: tokenData.institution?.id,
          institution_name: tokenData.institution?.name,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (enrollmentError) {
        console.error('❌ Error storing enrollment:', enrollmentError);
        return res.status(500).json({
          error: 'Failed to store enrollment',
          message: enrollmentError.message
        });
      }

      // Sync accounts for this user
      const syncResult = await tellerService.syncAccountsForUser(
        userId,
        tokenData.access_token, // Use plaintext token for API calls
        tokenData.enrollment_id
      );

      res.json({
        success: true,
        enrollment_id: tokenData.enrollment_id,
        institution: tokenData.institution,
        sync_results: syncResult
      });

    } catch (error) {
      console.error('❌ Error in exchangeToken:', error);
      res.status(500).json({
        error: 'Failed to exchange token',
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
}

module.exports = new TellerController();