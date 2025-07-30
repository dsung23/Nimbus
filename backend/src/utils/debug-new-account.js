// Debug script to trace new account connection process
const { getClient } = require('./database');
const tellerService = require('../services/tellerService');

async function debugNewAccountConnection() {
  const supabase = getClient();
  
  console.log('🧪 Starting debug of new account connection process...\n');
  
  try {
    // Step 1: Find an existing enrollment to test with
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('teller_enrollments')
      .select('user_id, enrollment_id, access_token, institution_name')
      .eq('status', 'active')
      .limit(1);

    if (enrollmentError || !enrollments || enrollments.length === 0) {
      console.log('❌ No active enrollments found for testing');
      return;
    }

    const enrollment = enrollments[0];
    console.log(`📋 Using enrollment: ${enrollment.institution_name} for user ${enrollment.user_id}`);
    
    // Step 2: Get current accounts for this enrollment
    const { data: existingAccounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, name, balance, teller_account_id')
      .eq('teller_enrollment_id', enrollment.enrollment_id);
      
    console.log(`📊 Found ${existingAccounts?.length || 0} existing accounts for this enrollment`);
    
    // Step 3: Clear all caches to simulate fresh connection
    console.log('🗑️ Clearing all caches...');
    tellerService.clearCacheForUser(enrollment.user_id);
    
    // Step 4: Simulate the account sync process with detailed logging
    console.log('\n🔄 Starting account sync with detailed logging...');
    console.log('============================================');
    
    // Get Teller accounts directly to see raw data
    console.log('📡 Fetching accounts from Teller API...');
    const tellerAccounts = await tellerService.fetchAccountsFromTeller(enrollment.access_token);
    
    console.log(`📋 Teller API returned ${tellerAccounts.length} accounts:`);
    tellerAccounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.name} (${account.id})`);
      console.log(`     Type: ${account.type}, Status: ${account.status}`);
      console.log(`     Links:`, account.links || 'None');
    });
    
    // Step 5: Test balance fetching for each account
    console.log('\n💰 Testing balance fetching for each account...');
    console.log('=================================================');
    
    for (const tellerAccount of tellerAccounts) {
      console.log(`\n🔍 Testing balance for: ${tellerAccount.name} (${tellerAccount.id})`);
      
      try {
        // Clear cache for this specific account
        tellerService.clearBalanceCache(enrollment.access_token, tellerAccount.id);
        
        // Fetch balance
        const balanceData = await tellerService.getAccountBalance(enrollment.access_token, tellerAccount.id);
        
        console.log(`✅ Balance fetch successful:`);
        console.log(`   Current: $${balanceData.current_balance}`);
        console.log(`   Available: $${balanceData.available_balance}`);
        
        // Check if this account exists in our database
        const { data: dbAccount } = await supabase
          .from('accounts')
          .select('id, name, balance, available_balance, notes')
          .eq('teller_account_id', tellerAccount.id)
          .single();
          
        if (dbAccount) {
          console.log(`📋 Database record found:`);
          console.log(`   Current DB Balance: $${dbAccount.balance}`);
          console.log(`   Current DB Available: $${dbAccount.available_balance}`);
          console.log(`   Notes: ${dbAccount.notes || 'None'}`);
          
          // Compare values
          if (dbAccount.balance === 5678.90) {
            console.log(`🚨 FOUND PROBLEMATIC ACCOUNT! This account has the 5678.90 issue!`);
            console.log(`   Teller says: $${balanceData.current_balance}`);
            console.log(`   Database has: $${dbAccount.balance}`);
          }
        } else {
          console.log(`📋 No database record found (would be created as new account)`);
        }
        
      } catch (error) {
        console.error(`❌ Balance fetch failed for ${tellerAccount.name}:`, error.message);
      }
    }
    
    console.log('\n✅ Debug process completed');
    
  } catch (error) {
    console.error('❌ Debug process failed:', error);
  }
}

// Run the debug process
debugNewAccountConnection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 