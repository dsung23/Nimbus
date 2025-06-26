// Persistent Chat Routes - Using Supabase for storage
const express = require('express');
const router = express.Router();
const supabaseChatService = require('../services/supabaseChatService');
const { callGroq, callGroqWithContext } = require('../services/groqService');

// Create a new chat session
router.post('/sessions', async (req, res) => {
  try {
    const { userId, title } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    const session = await supabaseChatService.createSession(userId, title);

    res.json({
      success: true,
      message: 'Chat session created successfully',
      session
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all sessions for a user
router.get('/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const sessions = await supabaseChatService.getUserSessions(
      userId, 
      parseInt(limit), 
      parseInt(offset)
    );

    res.json({
      success: true,
      sessions,
      count: sessions.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get a specific session with all messages
router.get('/sessions/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const session = await supabaseChatService.getSession(sessionId, userId);

    res.json({
      success: true,
      session
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add a message to a session
router.post('/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { role, content } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: 'role and content are required'
      });
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be user, assistant, or system'
      });
    }

    const session = await supabaseChatService.addMessage(sessionId, role, content);

    res.json({
      success: true,
      message: 'Message added successfully',
      session
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get conversation context for AI (last N messages)
router.get('/sessions/:sessionId/context', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { maxMessages = 20 } = req.query;

    const context = await supabaseChatService.getConversationContext(
      sessionId, 
      parseInt(maxMessages)
    );

    res.json({
      success: true,
      context
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update session title
router.patch('/sessions/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'title is required'
      });
    }

    const session = await supabaseChatService.updateSessionTitle(sessionId, title, userId);

    res.json({
      success: true,
      message: 'Session title updated successfully',
      session
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete a session (soft delete)  
router.delete('/sessions/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const session = await supabaseChatService.deleteSession(sessionId, userId);

    res.json({
      success: true,
      message: 'Session deleted successfully',
      session
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Search messages
router.get('/search/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { q: searchTerm, limit = 50 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term (q) is required'
      });
    }

    const results = await supabaseChatService.searchMessages(
      userId, 
      searchTerm, 
      parseInt(limit)
    );

    res.json({
      success: true,
      results,
      count: results.length,
      searchTerm
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get session statistics
router.get('/sessions/:sessionId/stats', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const stats = await supabaseChatService.getSessionStats(sessionId);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Chat with AI - Full conversation flow
router.post('/sessions/:sessionId/chat', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'content is required'
      });
    }

    // Step 1: Add user message to session
    await supabaseChatService.addMessage(sessionId, 'user', content);

    // Step 2: Get conversation context for AI
    const context = await supabaseChatService.getConversationContext(sessionId, 10);
    
    // Step 3: Prepare messages for Groq (convert format)
    const groqMessages = [
      { role: "system", content: "You are a helpful finance assistant." },
      ...context.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Step 4: Send to Groq with full context
    const aiResponse = await callGroqWithContext(groqMessages);

    // Step 5: Add AI response to session
    const updatedSession = await supabaseChatService.addMessage(sessionId, 'assistant', aiResponse);

    res.json({
      success: true,
      message: 'Chat completed successfully',
      userMessage: content,
      aiResponse: aiResponse,
      session: updatedSession
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
