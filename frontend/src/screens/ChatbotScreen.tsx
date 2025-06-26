import React, { useRef, useState, useEffect } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Animated, Keyboard, TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/native';
import { Background } from '../components/Background';
import { MessageComponent } from '../components/MessageComponent';
import { useChat } from '../hooks/useChat';
import { Ionicons } from '@expo/vector-icons';

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

const InputContainer = styled.View<{ isKeyboardVisible: boolean }>`
  padding: 12px 16px;
  padding-bottom: ${props => props.isKeyboardVisible ? '80px' : '120px'};
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

const StyledTextInput = styled(TextInput)`
  color: #ffffff;
  font-size: 16px;
  max-height: 80px;
  min-height: 20px;
  padding: 0;
  keyboardAppearance: dark;
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

const FloatingTypingIndicatorContainer = styled.View`
  padding-left: 24px;
  padding-bottom: 8px;
  margin-bottom: 20px;
  z-index: 10;
`;

const FloatingTypingIndicator: React.FC = () => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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
    <FloatingTypingIndicatorContainer>
      <TypingDots>
        <TypingDot style={{ transform: [{ translateY: dot1Anim }] }} />
        <TypingDot style={{ transform: [{ translateY: dot2Anim }] }} />
        <TypingDot style={{ transform: [{ translateY: dot3Anim }] }} />
      </TypingDots>
    </FloatingTypingIndicatorContainer>
  );
};

export const ChatbotScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { messages, inputText, setInputText, isLoading, sendMessage } = useChat(scrollViewRef);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  return (
    <Background>
      <Container>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((message) => (
                <MessageComponent key={message.id} message={message} />
              ))}
              {isLoading && (
                <MessageComponent 
                  message={{ id: 'loading', isFromUser: false, text: '', timestamp: new Date() }} 
                />
              )}
            </MessagesContainer>

            {isLoading && <FloatingTypingIndicator />}

            <InputContainer isKeyboardVisible={isKeyboardVisible}>
              <InputWrapper>
                <StyledTextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask me anything..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  multiline
                  textAlignVertical="top"
                  editable={true}
                  keyboardAppearance="dark"
                />
              </InputWrapper>
              <SendButton 
                disabled={!inputText.trim() || isLoading}
                onPress={sendMessage}
              >
                <Ionicons 
                  name="send" 
                  size={16} 
                  color={!inputText.trim() || isLoading ? "rgba(255, 255, 255, 0.3)" : "#ffffff"} 
                />
              </SendButton>
            </InputContainer>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Container>
    </Background>
  );
}; 