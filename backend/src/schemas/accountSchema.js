// Account Schema for CoFund Personal Finance App
// This schema defines the structure for bank account data
// -- Created: 2025-01-15
// -- Author: Suhaib Aden

const accountSchema = {
  tableName: 'accounts',
  
  // SQL for creating the accounts table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Account Information
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('depository', 'credit', 'loan', 'investment', 'other')),
      subtype VARCHAR(50),
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
      institution VARCHAR(100),
      account_number VARCHAR(50),
      routing_number VARCHAR(20),
      
      -- Financial Data
      balance DECIMAL(15,2) DEFAULT 0.00,
      available_balance DECIMAL(15,2) DEFAULT 0.00,
      currency VARCHAR(3) DEFAULT 'USD',
      
      -- Teller API Integration
      teller_account_id VARCHAR(255) UNIQUE,
      teller_institution_id VARCHAR(255),
      teller_enrollment_id VARCHAR(255),
      teller_last_four VARCHAR(4),
      last_sync TIMESTAMP WITH TIME ZONE,
      sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'failed', 'disabled')),
      verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'failed')),
      
      -- Account Status
      is_active BOOLEAN DEFAULT TRUE,
      is_primary BOOLEAN DEFAULT FALSE,
      
      -- Metadata
      notes TEXT,
      color VARCHAR(7) DEFAULT '#3B82F6',
      icon VARCHAR(50),
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_teller_id ON accounts(teller_account_id);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_teller_enrollment ON accounts(teller_enrollment_id);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_last_sync ON accounts(last_sync);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_institution ON accounts(institution);',
    'CREATE INDEX IF NOT EXISTS idx_accounts_verification_status ON accounts(verification_status);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);'
  ],
  
  // Validation rules
  validation: {
    user_id: {
      required: true,
      type: 'uuid'
    },
    name: {
      required: true,
      type: 'string',
      maxLength: 100
    },
    type: {
      required: true,
      type: 'string',
      enum: ['depository', 'credit', 'loan', 'investment', 'other']
    },
    subtype: {
      required: false,
      type: 'string',
      maxLength: 50
    },
    status: {
      required: false,
      type: 'string',
      enum: ['open', 'closed']
    },
    institution: {
      required: false,
      type: 'string',
      maxLength: 100
    },
    account_number: {
      required: false,
      type: 'string',
      maxLength: 50
    },
    routing_number: {
      required: false,
      type: 'string',
      maxLength: 20
    },
    balance: {
      required: false,
      type: 'number',
      min: -999999999.99,
      max: 999999999.99
    },
    available_balance: {
      required: false,
      type: 'number',
      min: -999999999.99,
      max: 999999999.99
    },
    currency: {
      required: false,
      type: 'string',
      maxLength: 3
    },
    teller_account_id: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    teller_institution_id: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    teller_enrollment_id: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    teller_last_four: {
      required: false,
      type: 'string',
      maxLength: 4
    },
    sync_status: {
      required: false,
      type: 'string',
      enum: ['pending', 'syncing', 'success', 'failed', 'disabled']
    },
    verification_status: {
      required: false,
      type: 'string',
      enum: ['unverified', 'verified', 'failed']
    },
    is_active: {
      required: false,
      type: 'boolean'
    },
    is_primary: {
      required: false,
      type: 'boolean'
    },
    notes: {
      required: false,
      type: 'string'
    },
    color: {
      required: false,
      type: 'string',
      maxLength: 7
    },
    icon: {
      required: false,
      type: 'string',
      maxLength: 50
    }
  }
};

module.exports = accountSchema; 