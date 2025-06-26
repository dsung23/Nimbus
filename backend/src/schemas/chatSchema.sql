-- Chat Sessions Schema with JSON Column Approach
-- This schema stores complete chat sessions with all messages in a JSONB column
-- Optimized for AI chat applications that need full conversation context

-- ============================================================================
-- CHAT SESSIONS TABLE
-- ============================================================================

CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Chat',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User lookup (most common query)
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Sort by recent activity
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- Active sessions only
CREATE INDEX idx_chat_sessions_active ON chat_sessions(user_id, is_active) WHERE is_active = true;

-- Full-text search within messages (GIN index for JSONB)
CREATE INDEX idx_chat_sessions_messages_gin ON chat_sessions USING GIN (messages);

-- Message count for analytics
CREATE INDEX idx_chat_sessions_message_count ON chat_sessions(message_count) WHERE message_count > 0;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own chat sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only insert their own chat sessions
CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own chat sessions
CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only delete their own chat sessions
CREATE POLICY "Users can delete own chat sessions"
  ON chat_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- EXAMPLE MESSAGE JSON STRUCTURE
-- ============================================================================

/*
Example of how messages are stored in the JSONB column:

{
  "messages": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "role": "user",
      "content": "Hello, I need help with budgeting",
      "timestamp": "2025-06-25T10:30:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001", 
      "role": "assistant",
      "content": "I'd be happy to help you with budgeting! Let's start with understanding your current financial situation...",
      "timestamp": "2025-06-25T10:30:05.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "role": "user", 
      "content": "I make $5000 per month but struggle to save",
      "timestamp": "2025-06-25T10:31:00.000Z"
    }
  ]
}
*/

-- ============================================================================
-- GRANTS (if needed for service role access)
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION add_message_to_session TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_chat_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_messages TO authenticated;

-- Grant execute on maintenance function to service role only
GRANT EXECUTE ON FUNCTION archive_old_sessions TO service_role;
