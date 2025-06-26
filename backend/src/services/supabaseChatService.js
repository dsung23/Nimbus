// Supabase Chat Service - persistent chat session storage
const { supabase } = require('../config');

class SupabaseChatService {
  
  /**
   * Create a new chat session
   */
  async createSession(userId, title = 'New Chat') {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          title: title
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }
  }

  /**
   * Add a message to an existing session
   */
  async addMessage(sessionId, role, content) {
    try {
      // Create message object
      const newMessage = {
        id: crypto.randomUUID(),
        role: role,
        content: content,
        timestamp: new Date().toISOString()
      };

      // Get current session to update messages
      const { data: session, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('messages, message_count')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Add new message to messages array
      const updatedMessages = [...session.messages, newMessage];

      // Update session with new message
      const { data, error } = await supabase
        .from('chat_sessions')
        .update({
          messages: updatedMessages,
          message_count: session.message_count + 1,
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add message: ${error.message}`);
    }
  }

  /**
   * Get a chat session with all messages
   */
  async getSession(sessionId, userId = null) {
    try {
      let query = supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId);

      // If userId provided, filter by user for security
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to get chat session: ${error.message}`);
    }
  }

  /**
   * Get all chat sessions for a user
   */
  async getUserSessions(userId, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id, title, created_at, updated_at, message_count, last_message_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to get user sessions: ${error.message}`);
    }
  }

  /**
   * Get conversation messages for AI context (last N messages)
   */
  async getConversationContext(sessionId, maxMessages = 20) {
    try {
      const session = await this.getSession(sessionId);
      
      // Get last N messages for AI context
      const messages = session.messages || [];
      const contextMessages = messages.slice(-maxMessages);

      return {
        sessionId: session.id,
        title: session.title,
        messages: contextMessages,
        totalMessages: messages.length
      };
    } catch (error) {
      throw new Error(`Failed to get conversation context: ${error.message}`);
    }
  }

  /**
   * Get full conversation with all messages and session details
   */
  async getFullConversation(sessionId, userId = null) {
    try {
      const session = await this.getSession(sessionId, userId);
      
      return {
        sessionId: session.id,
        userId: session.user_id,
        title: session.title,
        messages: session.messages || [],
        messageCount: session.message_count || 0,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        lastMessageAt: session.last_message_at,
        isActive: session.is_active
      };
    } catch (error) {
      throw new Error(`Failed to get full conversation: ${error.message}`);
    }
  }
}

module.exports = new SupabaseChatService();
