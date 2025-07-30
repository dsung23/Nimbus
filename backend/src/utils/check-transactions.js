// Script to check if transactions are causing the 5678.90 balance
const { getClient } = require('./database');

async function checkTransactions() {
  const supabase = getClient();
  console.log('🔍 Checking for transactions that might be causing the 5678.90 balance...');
  
  // Get one of the problematic accounts
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, name, balance, created_at')
    .eq('balance', 5678.90)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !accounts || accounts.length === 0) {
    console.log('No problematic accounts found');
    return;
  }

  const account = accounts[0];
  console.log(`Checking account: ${account.name} (Balance: $${account.balance})`);
  
  // Check transactions for this account
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false });

  if (txError) {
    console.error('Error fetching transactions:', txError);
    return;
  }

  if (!transactions || transactions.length === 0) {
    console.log('❌ No transactions found - balance should be 0, not 5678.90!');
    console.log('This suggests the balance is being set directly, not calculated from transactions');
    return;
  }

  console.log(`Found ${transactions.length} transactions:`);
  let calculatedBalance = 0;
  transactions.forEach(tx => {
    calculatedBalance += parseFloat(tx.amount);
    console.log(`  - ${tx.description}: $${tx.amount} (Running total: $${calculatedBalance})`);
  });
  
  console.log(`Calculated balance from transactions: $${calculatedBalance}`);
  console.log(`Actual account balance: $${account.balance}`);
  
  if (Math.abs(calculatedBalance - account.balance) > 0.01) {
    console.log('⚠️ MISMATCH! Transaction total does not match account balance');
  } else {
    console.log('✅ Transaction total matches account balance');
  }
}

checkTransactions().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); }); 