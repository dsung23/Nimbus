// Sync Service - Background job for regular account and transaction updates
// This service handles periodic syncing of accounts and transactions for all active users

const { getClient } = require('../utils/database');
const tellerService = require('./tellerService');
const cryptoService = require('../utils/crypto');

class SyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.syncIntervalMinutes = 30; // Sync every 30 minutes
  }

  /**
   * Start the background sync service
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 Sync service is already running');
      return;
    }

    console.log(`🚀 Starting background sync service (interval: ${this.syncIntervalMinutes} minutes)`);
    this.isRunning = true;

    // Run initial sync after 1 minute
    setTimeout(() => {
      this.performFullSync();
    }, 60000);

    // Set up recurring sync
    this.syncInterval = setInterval(() => {
      this.performFullSync();
    }, this.syncIntervalMinutes * 60 * 1000);
  }

  /**
   * Stop the background sync service
   */
  stop() {
    if (!this.isRunning) {
      console.log('🛑 Sync service is not running');
      return;
    }

    console.log('🛑 Stopping background sync service');
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform a full sync for all active enrollments
   */
  async performFullSync() {
    if (!this.isRunning) {
      console.log('⏸️ Sync service stopped, skipping sync');
      return;
    }

    const startTime = Date.now();
    console.log('🔄 Starting background sync for all active enrollments...');

    try {
      const supabase = getClient();
      
      // Get all active enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('teller_enrollments')
        .select('*')
        .eq('status', 'active');

      if (enrollmentError) {
        console.error('❌ Error fetching active enrollments:', enrollmentError);
        return;
      }

      if (!enrollments || enrollments.length === 0) {
        console.log('ℹ️ No active enrollments found for background sync');
        return;
      }

      console.log(`📊 Found ${enrollments.length} active enrollments to sync`);

      const syncResults = {
        enrollments_processed: 0,
        accounts_synced: 0,
        transactions_synced: 0,
        errors: []
      };

      // Process enrollments in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < enrollments.length; i += batchSize) {
        const batch = enrollments.slice(i, i + batchSize);
        
        console.log(`📦 Processing enrollment batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(enrollments.length / batchSize)}`);

        const batchPromises = batch.map(enrollment => this.syncEnrollment(enrollment));
        const batchResults = await Promise.allSettled(batchPromises);

        // Aggregate results
        batchResults.forEach((result, index) => {
          const enrollment = batch[index];
          syncResults.enrollments_processed++;

          if (result.status === 'fulfilled') {
            syncResults.accounts_synced += result.value.accounts;
            syncResults.transactions_synced += result.value.transactions;
          } else {
            console.error(`❌ Failed to sync enrollment ${enrollment.enrollment_id}:`, result.reason);
            syncResults.errors.push({
              enrollment_id: enrollment.enrollment_id,
              user_id: enrollment.user_id,
              error: result.reason.message
            });
          }
        });

        // Small delay between batches
        if (i + batchSize < enrollments.length) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Background sync completed in ${duration}ms`);
      console.log(`📊 Results: ${syncResults.enrollments_processed} enrollments, ${syncResults.accounts_synced} accounts, ${syncResults.transactions_synced} transactions`);
      
      if (syncResults.errors.length > 0) {
        console.log(`⚠️ Errors: ${syncResults.errors.length} enrollments failed`);
      }

    } catch (error) {
      console.error('❌ Error in background sync:', error);
    }
  }

  /**
   * Sync a single enrollment
   */
  async syncEnrollment(enrollment) {
    try {
      console.log(`🔄 Syncing enrollment ${enrollment.enrollment_id} for user ${enrollment.user_id}`);

      // Decrypt access token
      const accessToken = cryptoService.decrypt(enrollment.access_token);

      // Test token validity first
      try {
        await tellerService.fetchAccountsFromTeller(accessToken);
      } catch (tokenError) {
        console.warn(`⚠️ Invalid access token for enrollment ${enrollment.enrollment_id}, marking as expired`);
        
        // Mark enrollment as expired
        await getClient()
          .from('teller_enrollments')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('enrollment_id', enrollment.enrollment_id);

        throw new Error(`Access token expired for enrollment ${enrollment.enrollment_id}`);
      }

      // Sync accounts first
      const accountSyncResult = await tellerService.syncAccountsForUser(
        enrollment.user_id,
        accessToken,
        enrollment.enrollment_id
      );

      let totalTransactions = 0;

      // Get accounts for this enrollment
      const { data: accounts } = await getClient()
        .from('accounts')
        .select('id, teller_account_id, last_sync')
        .eq('user_id', enrollment.user_id)
        .eq('is_active', true);

      if (accounts && accounts.length > 0) {
        // Sync transactions and balances for each account
        for (const account of accounts) {
          try {
            // Only sync if last sync was more than 15 minutes ago
            const lastSync = new Date(account.last_sync || 0);
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

            if (lastSync < fifteenMinutesAgo) {
              // Sync transactions
              const transactionResult = await tellerService.syncTransactionsForAccount(
                account.id,
                accessToken,
                account.teller_account_id
              );

              totalTransactions += transactionResult.created + transactionResult.updated;

              // Sync account balance
              try {
                const balanceData = await tellerService.getAccountBalance(
                  accessToken,
                  account.teller_account_id
                );

                // Update account balance in database
                await getClient()
                  .from('accounts')
                  .update({
                    balance: balanceData.current_balance,
                    available_balance: balanceData.available_balance,
                    last_sync: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', account.id);

                console.log(`💰 Background sync updated balance for account ${account.id}: $${balanceData.current_balance}`);
              } catch (balanceError) {
                console.warn(`⚠️ Failed to sync balance for account ${account.id}:`, balanceError.message);
              }
            }
          } catch (transactionError) {
            console.warn(`⚠️ Failed to sync transactions for account ${account.id}:`, transactionError.message);
          }
        }
      }

      // Update enrollment last sync
      await getClient()
        .from('teller_enrollments')
        .update({ 
          last_sync: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('enrollment_id', enrollment.enrollment_id);

      return {
        accounts: accountSyncResult.created + accountSyncResult.updated,
        transactions: totalTransactions
      };

    } catch (error) {
      console.error(`❌ Error syncing enrollment ${enrollment.enrollment_id}:`, error);
      throw error;
    }
  }

  /**
   * Sync a specific user's accounts and transactions
   */
  async syncUser(userId) {
    console.log(`🔄 Starting sync for user ${userId}`);

    try {
      const supabase = getClient();
      
      // Get active enrollments for this user
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('teller_enrollments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (enrollmentError) {
        throw new Error(`Failed to fetch enrollments: ${enrollmentError.message}`);
      }

      if (!enrollments || enrollments.length === 0) {
        console.log(`ℹ️ No active enrollments found for user ${userId}`);
        return { accounts: 0, transactions: 0 };
      }

      let totalAccounts = 0;
      let totalTransactions = 0;

      for (const enrollment of enrollments) {
        try {
          const result = await this.syncEnrollment(enrollment);
          totalAccounts += result.accounts;
          totalTransactions += result.transactions;
        } catch (enrollmentError) {
          console.error(`❌ Failed to sync enrollment ${enrollment.enrollment_id}:`, enrollmentError.message);
        }
      }

      console.log(`✅ User sync completed: ${totalAccounts} accounts, ${totalTransactions} transactions`);
      return { accounts: totalAccounts, transactions: totalTransactions };

    } catch (error) {
      console.error(`❌ Error syncing user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get sync service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      syncIntervalMinutes: this.syncIntervalMinutes,
      nextSyncIn: this.syncInterval ? this.syncIntervalMinutes * 60 - ((Date.now() % (this.syncIntervalMinutes * 60 * 1000)) / 1000) : null
    };
  }
}

module.exports = new SyncService();