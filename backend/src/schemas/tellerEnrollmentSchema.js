// Teller Enrollment Schema for CoFund Personal Finance App
// This schema defines the structure for storing Teller enrollment data and access tokens
// -- Created: 2025-01-15
// -- Author: Suhaib Aden

const tellerEnrollmentSchema = {
  tableName: 'teller_enrollments',
  
  // SQL for creating the teller_enrollments table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS teller_enrollments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Teller Enrollment Information
      enrollment_id VARCHAR(255) UNIQUE NOT NULL,
      access_token TEXT NOT NULL, -- In production, this should be encrypted
      refresh_token TEXT, -- If Teller provides refresh tokens
      
      -- Institution Information
      institution_id VARCHAR(255),
      institution_name VARCHAR(255),
      
      -- Enrollment Status
      status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired', 'revoked')),
      last_sync TIMESTAMP WITH TIME ZONE,
      
      -- Token Information
      token_expires_at TIMESTAMP WITH TIME ZONE,
      scopes TEXT[], -- Array of scopes granted
      
      -- Metadata
      notes TEXT,
      webhook_url VARCHAR(500),
      
      -- Timestamps
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_teller_enrollments_user_id ON teller_enrollments(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_teller_enrollments_enrollment_id ON teller_enrollments(enrollment_id);',
    'CREATE INDEX IF NOT EXISTS idx_teller_enrollments_status ON teller_enrollments(status);',
    'CREATE INDEX IF NOT EXISTS idx_teller_enrollments_institution ON teller_enrollments(institution_id);',
    'CREATE INDEX IF NOT EXISTS idx_teller_enrollments_last_sync ON teller_enrollments(last_sync);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE teller_enrollments ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own enrollments" ON teller_enrollments FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert own enrollments" ON teller_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can update own enrollments" ON teller_enrollments FOR UPDATE USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can delete own enrollments" ON teller_enrollments FOR DELETE USING (auth.uid() = user_id);'
  ],
  
  // Validation rules
  validation: {
    user_id: {
      required: true,
      type: 'uuid'
    },
    enrollment_id: {
      required: true,
      type: 'string',
      maxLength: 255
    },
    access_token: {
      required: true,
      type: 'string'
    },
    refresh_token: {
      required: false,
      type: 'string'
    },
    institution_id: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    institution_name: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    status: {
      required: false,
      type: 'string',
      enum: ['active', 'disconnected', 'expired', 'revoked']
    },
    token_expires_at: {
      required: false,
      type: 'date'
    },
    scopes: {
      required: false,
      type: 'array'
    },
    notes: {
      required: false,
      type: 'string'
    },
    webhook_url: {
      required: false,
      type: 'string',
      maxLength: 500
    }
  }
};

module.exports = tellerEnrollmentSchema;