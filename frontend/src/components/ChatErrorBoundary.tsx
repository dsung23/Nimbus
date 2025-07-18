import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { ErrorBoundary } from './ErrorBoundary';
import { Ionicons } from '@expo/vector-icons';

const ChatErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 24px;
  background-color: rgba(0, 0, 0, 0.95);
`;

const ErrorIcon = styled(Ionicons)`
  margin-bottom: 16px;
`;

const ErrorTitle = styled.Text`
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
`;

const ErrorDescription = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  text-align: center;
  margin-bottom: 24px;
  line-height: 22px;
`;

const ActionButton = styled(TouchableOpacity)`
  background-color: rgba(0, 122, 255, 0.9);
  padding: 14px 28px;
  border-radius: 12px;
  margin-bottom: 12px;
`;

const ActionButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

const SecondaryButton = styled(TouchableOpacity)`
  padding: 14px 28px;
`;

const SecondaryButtonText = styled.Text`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
`;

interface ChatErrorFallbackProps {
  onRetry: () => void;
  onGoBack?: () => void;
}

const ChatErrorFallback: React.FC<ChatErrorFallbackProps> = ({ onRetry, onGoBack }) => (
  <ChatErrorContainer>
    <ErrorIcon name="alert-circle-outline" size={64} color="#ff4444" />
    <ErrorTitle>Chat Unavailable</ErrorTitle>
    <ErrorDescription>
      We're having trouble connecting to the chat service. This might be a temporary issue.
    </ErrorDescription>
    <ActionButton onPress={onRetry}>
      <ActionButtonText>Try Again</ActionButtonText>
    </ActionButton>
    {onGoBack && (
      <SecondaryButton onPress={onGoBack}>
        <SecondaryButtonText>Go Back</SecondaryButtonText>
      </SecondaryButton>
    )}
  </ChatErrorContainer>
);

interface ChatErrorBoundaryProps {
  children: React.ReactNode;
  onGoBack?: () => void;
}

export const ChatErrorBoundary: React.FC<ChatErrorBoundaryProps> = ({ children, onGoBack }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to your error tracking service (e.g., Sentry, Bugsnag)
    console.error('Chat Error:', error, errorInfo);
    
    // You could send this to your analytics service
    // analytics.track('chat_error', { 
    //   error: error.message,
    //   componentStack: errorInfo.componentStack 
    // });
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={
        <ChatErrorFallback 
          onRetry={() => window.location.reload()} 
          onGoBack={onGoBack}
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}; 