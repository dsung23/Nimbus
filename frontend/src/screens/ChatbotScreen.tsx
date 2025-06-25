import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { Background } from '../components/Background';

interface Message {
  id: string;
  text: string;
  isFromUser: boolean;
  timestamp: Date;
  isError?: boolean;
}

const Container = styled.View`
  flex: 1;
`;

const Header = styled.View`
  padding: 20px 16px 16px 16px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
`;

const HeaderTitle = styled.Text`
  color: #ffffff;
  font-size: 20px;
  font-weight: bold;
  margin-left: 8px;
`;

const MessagesContainer = styled(ScrollView)`
  flex: 1;
  padding: 0 16px;
`;

const MessageWrapper = styled.View<{ isFromUser: boolean }>`
  flex-direction: row;
  justify-content: ${props => props.isFromUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 16px;
  padding-horizontal: 4px;
`;

const MessageBubble = styled.View<{ isFromUser: boolean; isError?: boolean }>`
  max-width: 80%;
  padding: 16px;
  border-radius: 20px;
  ${props => {
    if (props.isError) {
      return `
        border-top-left-radius: 6px;
        background-color: rgba(220, 53, 69, 0.15);
        border: 1px solid rgba(220, 53, 69, 0.3);
      `;
    }
    return props.isFromUser ? `
    border-top-right-radius: 6px;
    background-color: rgba(75, 192, 192, 0.15);
    border: 1px solid rgba(75, 192, 192, 0.3);
  ` : `
    border-top-left-radius: 6px;
    background-color: rgba(138, 43, 226, 0.15);
    border: 1px solid rgba(138, 43, 226, 0.3);
    `;
  }}
  backdrop-filter: blur(10px);
`;

const MessageText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  line-height: 22px;
`;

const MessageTime = styled.Text<{ isFromUser: boolean }>`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-top: 6px;
  ${props => props.isFromUser ? 'text-align: right;' : 'text-align: left;'}
`;

const InputContainer = styled.View`
  padding: 16px;
  padding-bottom: 140px; /* Increased to lift above tab bar */
  flex-direction: row;
  align-items: flex-end;
  gap: 12px;
  background-color: rgba(5, 5, 5, 0.95);
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.1);
`;

const InputWrapper = styled.View`
  flex: 1;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 12px 16px;
  backdrop-filter: blur(10px);
`;

const StyledTextInput = styled.TextInput`
  color: #ffffff;
  font-size: 16px;
  max-height: 100px;
  min-height: 20px;
`;

const SendButton = styled(TouchableOpacity)<{ disabled: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: ${props => props.disabled ? 'rgba(75, 192, 192, 0.3)' : 'rgba(75, 192, 192, 0.8)'};
  border: 1px solid rgba(75, 192, 192, 0.3);
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
`;

const MessageComponent: React.FC<{ message: Message }> = ({ message }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MessageWrapper isFromUser={message.isFromUser}>
      <MessageBubble isFromUser={message.isFromUser} isError={message.isError}>
        <MessageText>{message.text}</MessageText>
        <MessageTime isFromUser={message.isFromUser}>
          {formatTime(message.timestamp)}
        </MessageTime>
      </MessageBubble>
    </MessageWrapper>
  );
};

export const ChatbotScreen: React.FC = () => {
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
  const scrollViewRef = useRef<ScrollView>(null);

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
        // Simulate 10% chance of error
        if (Math.random() < 0.1) {
          reject(new Error('Failed to connect to AI service. Please try again.'));
        } else {
          resolve(generateMockResponse());
        }
      }, 1000 + Math.random() * 2000); // 1-3 second delay
    });
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isFromUser: true,
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
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
      // Scroll to bottom after response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <Background>
      <Container>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? -60 : -60}
        >
          <Header>
            <Ionicons name="sparkles" size={24} color="#ffffff" />
            <HeaderTitle>Ask our AI anything</HeaderTitle>
          </Header>

          <MessagesContainer
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((message) => (
              <MessageComponent key={message.id} message={message} />
            ))}
            {isLoading && (
              <MessageWrapper isFromUser={false}>
                <MessageBubble isFromUser={false}>
                  <MessageText>...</MessageText>
                </MessageBubble>
              </MessageWrapper>
            )}
          </MessagesContainer>

          <InputContainer>
            <InputWrapper>
              <StyledTextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your financial question..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                textAlignVertical="top"
              />
            </InputWrapper>
            <SendButton 
              disabled={!inputText.trim() || isLoading}
              onPress={handleSend}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={!inputText.trim() || isLoading ? "rgba(255, 255, 255, 0.5)" : "#ffffff"} 
              />
            </SendButton>
          </InputContainer>
        </KeyboardAvoidingView>
      </Container>
    </Background>
  );
}; 