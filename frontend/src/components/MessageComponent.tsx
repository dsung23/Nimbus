import React from 'react';
import styled from 'styled-components/native';
import { Message } from '../types/message';
import { LoadingAnimation } from './LoadingAnimation';

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
    border: 2px solid rgba(75, 192, 192, 0.3);
  ` : `
    border-top-left-radius: 6px;
    background-color: rgba(138, 43, 226, 0.15);
    border: 2px solid rgba(138, 43, 226, 0.3);
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

export const MessageComponent: React.FC<{ message: Message }> = ({ message }) => {
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
  
    return (
      <MessageWrapper isFromUser={message.isFromUser}>
        <MessageBubble isFromUser={message.isFromUser} isError={message.isError}>
          {message.id === 'loading' ? <LoadingAnimation /> : <MessageText>{message.text}</MessageText>}
          <MessageTime isFromUser={message.isFromUser}>
            {message.id !== 'loading' && formatTime(message.timestamp)}
          </MessageTime>
        </MessageBubble>
      </MessageWrapper>
    );
  }; 