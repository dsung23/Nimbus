import React from 'react';
import styled from 'styled-components/native';
import { Message } from '../types/message';
import { LoadingAnimation } from './LoadingAnimation';
import { LinearGradient } from 'expo-linear-gradient';

const MessageWrapper = styled.View<{ isFromUser: boolean }>`
  flex-direction: row;
  justify-content: ${props => props.isFromUser ? 'flex-end' : 'flex-start'};
  margin-bottom: 16px;
  padding-horizontal: 4px;
`;

const MessageBubble = styled.View<{ isFromUser: boolean; isError?: boolean }>`
  max-width: 80%;
  border-radius: 20px;
  overflow: hidden;
  ${props => {
    if (props.isError) {
      return `
        border-top-left-radius: 6px;
        background-color: rgba(220, 53, 69, 0.15);
        border: 1px solid rgba(220, 53, 69, 0.3);
      `;
    }
    if (props.isFromUser) {
      // Remove background-color as gradient will handle it
      return `
        border-top-right-radius: 6px;
      `;
    }
    // AI bubble (if any left)
    return `
      border-top-left-radius: 6px;
      background-color: rgba(138, 43, 226, 0.15);
      border: 2px solid rgba(138, 43, 226, 0.3);
      backdrop-filter: blur(10px);
      font-weight: bold;
    `;
  }}
`;

const GradientWrapper = styled(LinearGradient)`
  padding: 16px;
`;

const RegularBubbleContent = styled.View`
  padding: 16px;
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

interface MessageComponentProps {
  message: Message;
  isTyping?: boolean;
}

export const MessageComponent: React.FC<MessageComponentProps> = ({ message, isTyping }) => {
  // No timestamp rendering for any message
  if (!message.isFromUser && !message.isError) {
    // AI message: plain text, no bubble, keep margin/padding
    return (
      <MessageWrapper isFromUser={false}>
        <MessageText style={{ padding: 16, maxWidth: '80%' }}>
          {message.text}
        </MessageText>
      </MessageWrapper>
    );
  }
  // User message or AI error message: keep bubble
  return (
    <MessageWrapper isFromUser={message.isFromUser}>
      <MessageBubble isFromUser={message.isFromUser} isError={message.isError}>
        {message.isFromUser ? (
          <GradientWrapper
            colors={['#007AFF', '#5856D6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MessageText>{message.text}</MessageText>
          </GradientWrapper>
        ) : (
          <RegularBubbleContent>
            {message.id === 'loading' ? <LoadingAnimation /> : <MessageText>{message.text}</MessageText>}
          </RegularBubbleContent>
        )}
      </MessageBubble>
    </MessageWrapper>
  );
}; 