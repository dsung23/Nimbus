// Account Schema for CoFund Personal Finance App
// This schema defines the structure for bank account data from Plaid
// -- Created: 2025-06-20
// --Author: Suhaib Aden

const accountSchema = {
  tableName: 'accounts',
  
  // SQL for creating the accounts table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plaid_account_id VARCHAR(255) NOT NULL,
      plaid_item_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      official_name VARCHAR(255),
      type VARCHAR(50) NOT NULL, -- checking, savings, credit, loan, investment
      subtype VARCHAR(50), -- paypal, venmo, etc.
      mask VARCHAR(10), -- last 4 digits
      institution_name VARCHAR(255),
      institution_id VARCHAR(255),
      current_balance DECIMAL(15,2),
      available_balance DECIMAL(15,2),
      limit_amount DECIMAL(15,2), -- for credit accounts
      currency_code VARCHAR(3) DEFAULT 'USD',
      is_active BOOLEAN DEFAULT TRUE,
      last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      UNIQUE(user_id, plaid_account_id)
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_plaid_account_id ON accounts(plaid_account_id);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_plaid_item_id ON accounts(plaid_item_id);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_last_sync_at ON accounts(last_sync_at);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);'
  ],
  
  // Validation rules
  validation: {
    user_id: {
      required: true,
      type: 'uuid'
    },
    plaid_account_id: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    plaid_item_id: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    name: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    type: {
      required: true,
      type: 'string',
      enum: ['checking', 'savings', 'credit', 'loan', 'investment']
    },
    current_balance: {
      required: false,
      type: 'number'
    },
    available_balance: {
      required: false,
      type: 'number'
    }
  }
};

module.exports = accountSchema; 