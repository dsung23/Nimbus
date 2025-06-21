// Transaction Schema for CoFund Personal Finance App
// This schema defines the structure for transaction data from Plaid
// -- Created: 2025-06-20
// --Author: Suhaib Aden
const transactionSchema = {
  tableName: 'transactions',
  
  // SQL for creating the transactions table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      plaid_transaction_id VARCHAR(255) UNIQUE NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      currency_code VARCHAR(3) DEFAULT 'USD',
      date DATE NOT NULL,
      authorized_date DATE,
      name VARCHAR(255) NOT NULL,
      merchant_name VARCHAR(255),
      primary_category VARCHAR(100),
      detailed_category VARCHAR(100),
      category_id VARCHAR(50),
      pending BOOLEAN DEFAULT FALSE,
      pending_transaction_id VARCHAR(255),
      account_owner VARCHAR(255),
      payment_channel VARCHAR(50), -- online, in store, other
      payment_processor VARCHAR(100),
      check_number VARCHAR(50),
      location JSONB, -- address, city, state, zip, country, lat, lon
      logo_url VARCHAR(500),
      website VARCHAR(500),
      authorized_datetime TIMESTAMP WITH TIME ZONE,
      datetime TIMESTAMP WITH TIME ZONE,
      transaction_code VARCHAR(50),
      personal_finance_category VARCHAR(100),
      personal_finance_category_icon VARCHAR(500),
      counter_parties JSONB, -- array of counterparty objects
      merchant_entity_id VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_plaid_transaction_id ON transactions(plaid_transaction_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_primary_category ON transactions(primary_category);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(pending);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_merchant_name ON transactions(merchant_name);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);'
  ],
  
  // Validation rules
  validation: {
    user_id: {
      required: true,
      type: 'uuid'
    },
    account_id: {
      required: true,
      type: 'uuid'
    },
    plaid_transaction_id: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    amount: {
      required: true,
      type: 'number'
    },
    date: {
      required: true,
      type: 'date'
    },
    name: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    pending: {
      required: false,
      type: 'boolean',
      default: false
    }
  }
};

module.exports = transactionSchema; 