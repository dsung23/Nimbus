// Test script to verify balance syncing works correctly
// This simulates what happens during account connection

const { getClient } = require('./database');
const tellerService = require('../services/tellerService');
const cryptoService = require('./crypto');

async function testBalanceSyncing() {
  const supabase = getClient();
  
  console.log('🧪 Testing balance syncing for account connections...\n');
  
  try {
    // Get a user with active Teller enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('teller_enrollments')
      .select('user_id, enrollment_id, access_token, institution_name')
      .eq('status', 'active')
      .limit(1);

    if (enrollmentError || !enrollments || enrollments.length === 0) {
      console.log('❌ No active enrollments found to test');
      return;
    }

    const enrollment = enrollments[0];
    console.log(`📋 Testing with enrollment: ${enrollment.enrollment_id}`);
    console.log(`🏦 Institution: ${enrollment.institution_name}`);
    console.log(`👤 User ID: ${enrollment.user_id}\n`);

    // Step 1: Clear all caches to simulate fresh connection
    console.log('🗑️ Step 1: Clearing all caches...');
    tellerService.clearCacheForUser(enrollment.user_id);
    tellerService.clearAllBalanceCaches();

    // Step 2: Get accounts before sync to see current state
    console.log('\n📊 Step 2: Checking current account balances...');
    const { data: accountsBefore, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, balance, available_balance, sync_status, last_sync')
      .eq('user_id', enrollment.user_id)
      .eq('teller_enrollment_id', enrollment.enrollment_id);

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      return;
    }

    if (!accountsBefore || accountsBefore.length === 0) {
      console.log('ℹ️ No existing accounts found - this will create new ones');
    } else {
      console.log('📋 Current account balances:');
      accountsBefore.forEach(account => {
        console.log(`  - ${account.name}: $${account.balance} (Available: $${account.available_balance})`);
        console.log(`    Status: ${account.sync_status}, Last Sync: ${account.last_sync || 'Never'}`);
      });
    }

    // Step 3: Simulate account connection by calling syncAccountsForUser
    console.log('\n🔄 Step 3: Simulating account connection (syncAccountsForUser)...');
    const accessToken = cryptoService.decrypt(enrollment.access_token);
    
    const syncResult = await tellerService.syncAccountsForUser(
      enrollment.user_id,
      accessToken,
      enrollment.enrollment_id
    );

    console.log(`✅ Sync completed: ${syncResult.created} created, ${syncResult.updated} updated`);
    if (syncResult.errors && syncResult.errors.length > 0) {
      console.log('⚠️ Sync errors:', syncResult.errors);
    }

    // Step 4: Check account balances after sync
    console.log('\n💰 Step 4: Checking balances after sync...');
    const { data: accountsAfter, error: accountsAfterError } = await supabase
      .from('accounts')
      .select('id, name, balance, available_balance, sync_status, last_sync, notes')
      .eq('user_id', enrollment.user_id)
      .eq('teller_enrollment_id', enrollment.enrollment_id);

    if (accountsAfterError) {
      console.error('❌ Error fetching accounts after sync:', accountsAfterError);
      return;
    }

    if (!accountsAfter || accountsAfter.length === 0) {
      console.log('❌ No accounts found after sync - something went wrong');
      return;
    }

    console.log('📋 Account balances after sync:');
    let hasCorrectBalances = true;
    accountsAfter.forEach(account => {
      console.log(`  - ${account.name}: $${account.balance} (Available: $${account.available_balance})`);
      console.log(`    Status: ${account.sync_status}, Last Sync: ${account.last_sync || 'Never'}`);
      console.log(`    Notes: ${account.notes || 'None'}`);
      
      // Check if balance looks like real data (not 0, not 5678.90)
      if (account.balance === 0 || account.balance === 5678.90) {
        hasCorrectBalances = false;
        console.log(`    ⚠️ This balance looks incorrect!`);
      } else {
        console.log(`    ✅ This balance looks correct!`);
      }
      console.log('');
    });

    // Step 5: Summary
    console.log('📊 Test Summary:');
    if (hasCorrectBalances) {
      console.log('✅ SUCCESS: All accounts have real balance data from Teller API');
      console.log('✅ Balance syncing is working correctly for new connections');
    } else {
      console.log('❌ ISSUE: Some accounts still have default/incorrect balances');
      console.log('❌ Balance syncing needs further investigation');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Export for use in other scripts
module.exports = {
  testBalanceSyncing
};

// If running directly from command line
if (require.main === module) {
  testBalanceSyncing()
    .then(() => {
      console.log('\n🎯 Balance sync test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Test error:', error);
      process.exit(1);
    });
} 