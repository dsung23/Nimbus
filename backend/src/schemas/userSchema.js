// User Schema for CoFund Personal Finance App
// This schema defines the structure for user data
// -- Created: 2025-06-20
// --Author: Suhaib Aden

const userSchema = {
  tableName: 'users',
  
  // SQL for creating the users table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100),
      phone VARCHAR(20),
      date_of_birth DATE,
      email_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT TRUE,
      preferences JSONB DEFAULT '{"role": "user"}'::jsonb
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);',
    'CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);',
    'CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);',
    'CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);',
    'CREATE POLICY "Users can delete own profile" ON users FOR DELETE USING (auth.uid() = id);'
  ],
  
  // Validation rules
  validation: {
    first_name: {
      required: true,
      type: 'string',
      maxLength: 100
    },
    last_name: {
      required: false,
      type: 'string',
      maxLength: 100
    },
    phone: {
      required: false,
      type: 'string',
      maxLength: 20
    },
    date_of_birth: {
      required: false,
      type: 'date'
    }
  }
};

module.exports = userSchema; 