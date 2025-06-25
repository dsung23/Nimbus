import React from 'react';
import { View, Text } from 'react-native';
import styled from 'styled-components/native';
import { Background } from '../components/Background';

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Title = styled.Text`
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
`;

export const ChatbotScreen: React.FC = () => {
  return (
    <Background>
      <Container>
        <Title>Chatbot</Title>
      </Container>
    </Background>
  );
}; 