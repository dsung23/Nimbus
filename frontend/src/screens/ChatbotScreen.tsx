import React, { useRef } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { Background } from '../components/Background';
import { MessageComponent } from '../components/MessageComponent';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { useChat } from '../hooks/useChat';

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

const StyledTextInput = styled(TextInput)`
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

export const ChatbotScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const { messages, inputText, setInputText, isLoading, sendMessage } = useChat(scrollViewRef);

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
              <MessageComponent 
                message={{ id: 'loading', isFromUser: false, text: '', timestamp: new Date() }} 
              />
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
              onPress={sendMessage}
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