// Utility script to identify and fix accounts with incorrect balance values
// Run this to check for accounts with default/mock balance values and re-sync them

const { getClient } = require('./database');
const tellerService = require('../services/tellerService');
const cryptoService = require('./crypto');

async function findProblematicAccounts() {
  const supabase = getClient();
  
  console.log('🔍 Checking for accounts with potentially incorrect balances...');
  
  // Look for accounts with common default/test values
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select(`
      id, 
      name, 
      balance, 
      available_balance, 
      sync_status,
      notes,
      teller_account_id,
      teller_enrollment_id,
      user_id,
      last_sync
    `)
    .or('balance.eq.5678.90,balance.eq.0,sync_status.eq.balance_failed,sync_status.eq.balance_invalid');

  if (error) {
    console.error('❌ Error fetching accounts:', error);
    return;
  }

  if (!accounts || accounts.length === 0) {
    console.log('✅ No problematic accounts found');
    return;
  }

  console.log(`⚠️ Found ${accounts.length} accounts that may need balance re-sync:`);
  
  accounts.forEach(account => {
    console.log(`  - Account: ${account.name} (ID: ${account.id})`);
    console.log(`    Balance: $${account.balance}, Available: $${account.available_balance}`);
    console.log(`    Sync Status: ${account.sync_status}`);
    console.log(`    Last Sync: ${account.last_sync || 'Never'}`);
    console.log(`    Notes: ${account.notes || 'None'}`);
    console.log('');
  });

  return accounts;
}

async function resyncAccountBalances(accountIds = null) {
  const supabase = getClient();
  
  console.log('🔄 Re-syncing account balances...');
  
  let accountsToSync;
  
  if (accountIds) {
    // Sync specific accounts
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id, 
        name, 
        teller_account_id,
        teller_enrollment_id,
        user_id
      `)
      .in('id', accountIds)
      .not('teller_account_id', 'is', null);
      
    if (error) {
      console.error('❌ Error fetching specific accounts:', error);
      return;
    }
    accountsToSync = accounts;
  } else {
    // Sync all Teller-connected accounts
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        id, 
        name, 
        teller_account_id,
        teller_enrollment_id,
        user_id
      `)
      .not('teller_account_id', 'is', null);
      
    if (error) {
      console.error('❌ Error fetching all accounts:', error);
      return;
    }
    accountsToSync = accounts;
  }

  if (!accountsToSync || accountsToSync.length === 0) {
    console.log('ℹ️ No Teller-connected accounts found to sync');
    return;
  }

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const account of accountsToSync) {
    try {
      console.log(`🔄 Re-syncing balance for: ${account.name}`);
      
      // Get the enrollment to access the access token
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('teller_enrollments')
        .select('access_token')
        .eq('enrollment_id', account.teller_enrollment_id)
        .eq('user_id', account.user_id)
        .single();

      if (enrollmentError || !enrollment) {
        console.error(`❌ Could not find enrollment for account ${account.name}`);
        results.failed++;
        results.errors.push(`Account ${account.name}: No enrollment found`);
        continue;
      }

      // Decrypt the access token
      const accessToken = cryptoService.decrypt(enrollment.access_token);
      
      // Fetch fresh balance from Teller
      const balanceData = await tellerService.getAccountBalance(accessToken, account.teller_account_id);
      
      // Update the account with fresh balance
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          balance: balanceData.current_balance,
          available_balance: balanceData.available_balance,
          sync_status: 'success',
          notes: 'Balance re-synced via fix-balances utility',
          last_sync: new Date().toISOString()
        })
        .eq('id', account.id);

      if (updateError) {
        console.error(`❌ Failed to update balance for ${account.name}:`, updateError);
        results.failed++;
        results.errors.push(`Account ${account.name}: ${updateError.message}`);
      } else {
        console.log(`✅ Successfully updated balance for ${account.name}: $${balanceData.current_balance}`);
        results.success++;
      }

    } catch (error) {
      console.error(`❌ Error re-syncing ${account.name}:`, error.message);
      results.failed++;
      results.errors.push(`Account ${account.name}: ${error.message}`);
    }
  }

  console.log('\n📊 Re-sync Results:');
  console.log(`  ✅ Successful: ${results.success}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n🔴 Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }

  return results;
}

// Export functions for use in other scripts
module.exports = {
  findProblematicAccounts,
  resyncAccountBalances
};

// If running directly from command line
if (require.main === module) {
  async function main() {
    try {
      console.log('🚀 Starting balance fix utility...\n');
      
      // First, find problematic accounts
      const problematicAccounts = await findProblematicAccounts();
      
      if (problematicAccounts && problematicAccounts.length > 0) {
        console.log('🔧 Re-syncing balances for problematic accounts...\n');
        const accountIds = problematicAccounts.map(acc => acc.id);
        await resyncAccountBalances(accountIds);
      }
      
      console.log('\n✅ Balance fix utility completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error running balance fix utility:', error);
      process.exit(1);
    }
  }
  
  main();
} 