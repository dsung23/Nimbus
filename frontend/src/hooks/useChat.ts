import { useState, useRef } from 'react';
import { ScrollView } from 'react-native';
import { Message } from '../types/message';

export const useChat = (scrollViewRef: React.RefObject<ScrollView | null>) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Nimbus, your AI financial assistant. I can help you with budgeting questions, investment insights, financial planning advice, and understanding your spending patterns. How can I assist you with your finances today?",
      isFromUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mockAIResponses = [
    "That's a great question! Based on current financial trends, I'd recommend...",
    "Let me help you with that financial planning question...",
    "From a budgeting perspective, here's what I suggest...",
    "That's an interesting investment query. Here's my analysis...",
    "I understand your concern about spending patterns. Let me explain..."
  ];

  const generateMockResponse = (): string => {
    return mockAIResponses[Math.floor(Math.random() * mockAIResponses.length)];
  };

  const simulateAPICall = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error('Failed to connect to AI service. Please try again.'));
        } else {
          resolve(generateMockResponse());
        }
      }, 1000 + Math.random() * 2000);
    });
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isFromUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const aiResponse = await simulateAPICall();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isFromUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error instanceof Error ? error.message : 'An unexpected error occurred.',
        isFromUser: false,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return { messages, inputText, setInputText, isLoading, sendMessage };
}; 