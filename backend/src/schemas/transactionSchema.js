// Transaction Schema for CoFund Personal Finance App
// This schema defines the structure for financial transaction data
// -- Created: 2025-01-15
// -- Author: Suhaib Aden

const transactionSchema = {
  tableName: 'transactions',
  
  // SQL for creating the transactions table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
      
      -- Transaction Details
      amount DECIMAL(15,2) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
      description TEXT NOT NULL,
      date DATE NOT NULL,
      posted_date DATE,
      
      -- Teller API Integration
      teller_transaction_id VARCHAR(255) UNIQUE,
      teller_category VARCHAR(100),
      teller_merchant VARCHAR(255),
      teller_location VARCHAR(255),
      
      -- Categorization (will reference categories table when created)
      category_id UUID, -- Will reference categories table (to be created later)
      subcategory_id UUID, -- Will reference subcategories table (to be created later)
      
      -- User Customization
      user_category VARCHAR(100),
      user_merchant VARCHAR(255),
      tags TEXT[],
      notes TEXT,
      
      -- Recurring Transaction Support
      is_recurring BOOLEAN DEFAULT FALSE,
      recurring_id UUID,
      recurring_pattern VARCHAR(50) CHECK (recurring_pattern IN ('weekly', 'monthly', 'yearly')),
      recurring_interval INTEGER DEFAULT 1,
      
      -- Transaction Status
      status VARCHAR(20) DEFAULT 'posted' CHECK (status IN ('pending', 'posted', 'cancelled', 'disputed')),
      is_verified BOOLEAN DEFAULT FALSE,
      
      -- Metadata
      check_number VARCHAR(20),
      reference_number VARCHAR(50),
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_teller_id ON transactions(teller_transaction_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(recurring_id);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions(account_id, date DESC);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);',
    'CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(user_merchant);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);',
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
    amount: {
      required: true,
      type: 'number',
      min: -999999999.99,
      max: 999999999.99
    },
    type: {
      required: true,
      type: 'string',
      enum: ['income', 'expense', 'transfer']
    },
    description: {
      required: true,
      type: 'string',
      maxLength: 1000
    },
    date: {
      required: true,
      type: 'date'
    },
    posted_date: {
      required: false,
      type: 'date'
    },
    teller_transaction_id: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    teller_category: {
      required: false,
      type: 'string',
      maxLength: 100
    },
    teller_merchant: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    teller_location: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    category_id: {
      required: false,
      type: 'uuid'
    },
    subcategory_id: {
      required: false,
      type: 'uuid'
    },
    user_category: {
      required: false,
      type: 'string',
      maxLength: 100
    },
    user_merchant: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    tags: {
      required: false,
      type: 'array'
    },
    notes: {
      required: false,
      type: 'string'
    },
    is_recurring: {
      required: false,
      type: 'boolean'
    },
    recurring_id: {
      required: false,
      type: 'uuid'
    },
    recurring_pattern: {
      required: false,
      type: 'string',
      enum: ['weekly', 'monthly', 'yearly']
    },
    recurring_interval: {
      required: false,
      type: 'integer',
      min: 1,
      max: 12
    },
    status: {
      required: false,
      type: 'string',
      enum: ['pending', 'posted', 'cancelled', 'disputed']
    },
    is_verified: {
      required: false,
      type: 'boolean'
    },
    check_number: {
      required: false,
      type: 'string',
      maxLength: 20
    },
    reference_number: {
      required: false,
      type: 'string',
      maxLength: 50
    }
  }
};

module.exports = transactionSchema; 