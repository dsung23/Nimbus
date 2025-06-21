// Chat Message Schema for CoFund Personal Finance App
// This schema defines the structure for individual chatbot messages within sessions
// -- Created: 2025-06-20
// --Author: Suhaib Aden

const chatMessageSchema = {
  tableName: 'chat_messages',
  
  // SQL for creating the chat_messages table
  createTableSQL: `
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL, -- user, assistant, system
      content TEXT NOT NULL,
      tokens_used INTEGER DEFAULT 0,
      cost DECIMAL(10,6) DEFAULT 0, -- cost in USD
      metadata JSONB DEFAULT '{}'::jsonb, -- additional data like financial context, etc.
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,
  
  // Indexes for better query performance
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at);'
  ],
  
  // Row Level Security (RLS) policies for Supabase
  rlsPolicies: [
    'ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;',
    'CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can update own chat messages" ON chat_messages FOR UPDATE USING (auth.uid() = user_id);',
    'CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);',
    'CREATE POLICY "Users can delete own chat messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);'
  ],
  
  // Validation rules
  validation: {
    session_id: {
      required: true,
      type: 'uuid'
    },
    user_id: {
      required: true,
      type: 'uuid'
    },
    role: {
      required: true,
      type: 'string',
      enum: ['user', 'assistant', 'system']
    },
    content: {
      required: true,
      type: 'string',
      minLength: 1
    },
    tokens_used: {
      required: false,
      type: 'integer',
      min: 0
    },
    cost: {
      required: false,
      type: 'number',
      min: 0
    }
  }
};

module.exports = chatMessageSchema; 