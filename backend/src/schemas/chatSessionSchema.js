// Chat Session Schema for CoFund Personal Finance App
// This schema defines the structure for chatbot conversation sessions
// -- Created: 2025-06-20
// --Author: Suhaib Aden

const chatSessionSchema = {
  tableName: 'chat_sessions',
  
  // SQL for creating the chat_sessions table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255),
      summary TEXT,
      context JSONB DEFAULT '{}'::jsonb, -- financial context, user preferences
      model_used VARCHAR(100), -- gpt-4, gpt-3.5-turbo, claude-3, etc.
      total_tokens INTEGER DEFAULT 0,
      total_cost DECIMAL(10,6) DEFAULT 0, -- cost in USD
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_active ON chat_sessions(is_active);',
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON chat_sessions(last_message_at);',
    'CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_active ON chat_sessions(user_id, is_active);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);'
  ],
  
  // Validation rules
  validation: {
    user_id: {
      required: true,
      type: 'uuid'
    },
    title: {
      required: false,
      type: 'string',
      maxLength: 255
    },
    summary: {
      required: false,
      type: 'string'
    },
    model_used: {
      required: false,
      type: 'string',
      maxLength: 100
    },
    total_tokens: {
      required: false,
      type: 'integer',
      min: 0
    },
    total_cost: {
      required: false,
      type: 'number',
      min: 0
    },
    is_active: {
      required: false,
      type: 'boolean',
      default: true
    }
  }
};

module.exports = chatSessionSchema; 