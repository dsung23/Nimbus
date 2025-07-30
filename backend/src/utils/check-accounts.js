// Quick script to check for accounts with problematic balances
const { getClient } = require('./database');

async function checkRecentAccounts() {
  const supabase = getClient();
  console.log('🔍 Checking for recent accounts with problematic balances...');
  
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, balance, available_balance, sync_status, created_at, last_sync, notes')
    .or('balance.eq.5678.90,balance.eq.0')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!accounts || accounts.length === 0) {
    console.log('✅ No accounts found with problematic balances');
    return;
  }

  console.log(`⚠️ Found ${accounts.length} accounts with potentially problematic balances:`);
  accounts.forEach(account => {
    console.log(`  - ${account.name}: $${account.balance} (Available: $${account.available_balance})`);
    console.log(`    Created: ${account.created_at}`);
    console.log(`    Last Sync: ${account.last_sync || 'Never'}`);
    console.log(`    Status: ${account.sync_status}`);
    console.log(`    Notes: ${account.notes || 'None'}`);
    console.log('');
  });
}

checkRecentAccounts().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); }); 