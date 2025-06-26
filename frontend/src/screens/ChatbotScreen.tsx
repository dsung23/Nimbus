import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import styled from 'styled-components/native';
import { Background } from '../components/Background';
import { Ionicons } from '@expo/vector-icons';

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
  padding: 16px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255, 255, 255, 0.1);
`;

const HeaderTitle = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin-left: 0;
`;

const MessagesContainer = styled(ScrollView)`
  flex: 1;
  padding: 0 16px;
  
`;

const MessageWrapper = styled.View<{ isFromUser: boolean }>`
  flex-direction: row;
  justify-content: ${props => props.isFromUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 12px;
  padding-horizontal: 4px;
`;

const MessageBubble = styled.View<{ isFromUser: boolean; isError?: boolean }>`
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 20px;
  ${props => {
    if (props.isError) {
      return `
        border-top-left-radius: 6px;
        background-color: rgba(220, 53, 69, 0.15);
        border: 1px solid rgba(220, 53, 69, 0.3);
      `;
    }
    if (!props.isFromUser) {
      // AI message: no background, no border, but keep padding/margin
      return '';
    }
    // User message: keep bubble style
    return `
      border-top-right-radius: 6px;
      background-color: rgba(128, 128, 128, 0.15);
      border: 1px solid rgba(128, 128, 128, 0.3);
      backdrop-filter: blur(10px);
    `;
  }}
`;

const MessageText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  line-height: 22px;
`;

const InputContainer = styled.View`
  padding: 12px 16px;
  padding-bottom: 110px;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: rgba(5, 5, 5, 0.95);
  border-top-width: 1px;
  border-top-color: rgba(255, 255, 255, 0.1);
`;

const InputWrapper = styled.View`
  flex: 1;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 10px 14px;
  backdrop-filter: blur(10px);
  min-height: 44px;
  justify-content: center;
`;

const StyledTextInput = styled.TextInput`
  color: #ffffff;
  font-size: 16px;
  max-height: 80px;
  min-height: 20px;
  padding: 0;
`;

const SendButton = styled(TouchableOpacity)<{ disabled: boolean }>`
  padding: 8px;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border-width: 0;
`;

const TypingIndicator = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 12px;
  padding-left: 8px;
`;

const TypingDots = styled.View`
  flex-direction: row;
  gap: 4px;
`;

const TypingDot = styled(Animated.View)`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.6);
`;

const AnimatedMessageWrapper = styled(Animated.View)<{ isFromUser: boolean }>`
  flex-direction: row;
  justify-content: ${props => props.isFromUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 12px;
  padding-horizontal: 4px;
`;

const MessageComponent: React.FC<{ message: Message }> = ({ message }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <AnimatedMessageWrapper 
      isFromUser={message.isFromUser}
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      <MessageBubble isFromUser={message.isFromUser} isError={message.isError}>
        <MessageText>{message.text}</MessageText>
      </MessageBubble>
    </AnimatedMessageWrapper>
  );
};

const TypingIndicatorComponent: React.FC = () => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.stagger(150, [
          Animated.sequence([
            Animated.timing(dot1Anim, { toValue: -8, duration: 350, useNativeDriver: true }),
            Animated.timing(dot1Anim, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2Anim, { toValue: -8, duration: 350, useNativeDriver: true }),
            Animated.timing(dot2Anim, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3Anim, { toValue: -8, duration: 350, useNativeDriver: true }),
            Animated.timing(dot3Anim, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animate();
  }, []);

  return (
    <TypingIndicator>
      <MessageBubble isFromUser={false}>
        <TypingDots>
          <TypingDot style={{ transform: [{ translateY: dot1Anim }] }} />
          <TypingDot style={{ transform: [{ translateY: dot2Anim }] }} />
          <TypingDot style={{ transform: [{ translateY: dot3Anim }] }} />
        </TypingDots>
      </MessageBubble>
    </TypingIndicator>
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Header>
            <HeaderTitle>Nimbus AI</HeaderTitle>
          </Header>

          <MessagesContainer
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingVertical: 16, paddingBottom: 20 }}
            keyboardShouldPersistTaps="always"
          >
            {messages.map((message) => (
              <MessageComponent key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicatorComponent />}
          </MessagesContainer>

          <InputContainer>
            <InputWrapper>
              <StyledTextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me anything..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                textAlignVertical="top"
                editable={true}
              />
            </InputWrapper>
            <SendButton 
              disabled={!inputText.trim() || isLoading}
              onPress={handleSend}
            >
              <Ionicons 
                name="send" 
                size={16} 
                color={!inputText.trim() || isLoading ? "rgba(255, 255, 255, 0.3)" : "#ffffff"} 
              />
            </SendButton>
          </InputContainer>
        </KeyboardAvoidingView>
      </Container>
    </Background>
  );
}; 