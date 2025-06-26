import { useState, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types/message';
import { API_ENDPOINTS } from '../config/api';

export const useChat = (scrollViewRef: React.RefObject<ScrollView | null>) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize chat session
  const initializeSession = async (): Promise<string> => {
    console.log('[useChat] 🚀 Initializing chat session...');
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      console.log('[useChat] 🔑 Got Access Token:', !!accessToken);
      if (!accessToken) {
        throw new Error('No access token found');
      }

      // Get user ID from token (you might need to decode JWT or store user ID separately)
      console.log('[useChat] 👤 Fetching user profile...');
      const userResponse = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to get user profile - Status: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      const userId = userData.user.id;
      console.log('[useChat] 🆔 Got User ID:', userId);

      // Create a new chat session
      console.log(`[useChat] 💬 Creating new session for user ${userId}...`);
      const sessionResponse = await fetch(`${API_ENDPOINTS.CHAT.SESSIONS}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: 'New Chat Session'
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.text();
        throw new Error(`Failed to create chat session - Status: ${sessionResponse.status} - ${errorData}`);
      }

      const sessionData = await sessionResponse.json();
      console.log('[useChat] ✅ Session created successfully:', sessionData.session.id);
      return sessionData.session.id;
    } catch (error) {
      console.error('[useChat] 🔴 Session initialization error:', error);
      throw error;
    }
  };

  // Send message to backend
  const sendMessageToBackend = async (content: string): Promise<string> => {
    console.log(`[useChat] 📤 Sending message to session ${sessionId}...`);
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('No access token found');
      }

      if (!sessionId) {
        throw new Error('No active chat session');
      }

      console.log('[useChat] 🗣️ Request Body:', JSON.stringify({ content }));
      const response = await fetch(`${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const data = await response.json();
      console.log('[useChat] 🤖 AI Response received:', data.aiResponse);
      return data.aiResponse;
    } catch (error) {
      console.error('[useChat] 🔴 Send message error:', error);
      throw error;
    }
  };

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        const newSessionId = await initializeSession();
        setSessionId(newSessionId);
        
        // Add welcome message
        setMessages([{
          id: 'welcome',
          text: "Hello! I'm Nimbus, your AI financial assistant. I can help you with budgeting questions, investment insights, financial planning advice, and understanding your spending patterns. How can I assist you with your finances today?",
          isFromUser: false,
          timestamp: new Date(),
        }]);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to initialize chat');
        setMessages([{
          id: 'error',
          text: 'Failed to connect to chat service. Please try again later.',
          isFromUser: false,
          timestamp: new Date(),
          isError: true,
        }]);
      } finally {
        console.log('[useChat] 🏁 Initialization finished.');
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !sessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isFromUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const aiResponse = await sendMessageToBackend(userMessage.text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isFromUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('[useChat] 🔴 Failed to get AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'An unexpected error occurred.',
        isFromUser: false,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return { 
    messages, 
    inputText, 
    setInputText, 
    isLoading, 
    sendMessage,
    error,
    sessionId 
  };
}; 