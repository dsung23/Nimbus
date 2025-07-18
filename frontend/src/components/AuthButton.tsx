import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import styled, { css } from 'styled-components/native';
import { BlurView } from 'expo-blur';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}

const ButtonContainer = styled(TouchableOpacity)<{ variant: 'primary' | 'secondary', disabled?: boolean }>`
  width: 100%;
  padding: 18px;
  border-radius: 16px;
  align-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);

  ${({ variant }) =>
    variant === 'secondary' &&
    css`
      margin-top: 16px;
      border-color: transparent;
    `}
  
  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.5;
    `}
`;

const ButtonText = styled(Text)<{ variant: 'primary' | 'secondary' }>`
  font-size: 16px;
  font-weight: bold;
  color: #fff;

  ${({ variant }) =>
    variant === 'secondary' &&
    css`
      color: rgba(255, 255, 255, 0.7);
    `}
`;

export const AuthButton: React.FC<AuthButtonProps> = ({ title, onPress, variant, disabled }) => {
  return (
    <ButtonContainer variant={variant} onPress={onPress} disabled={disabled}>
      <BlurView
        intensity={variant === 'primary' ? 60 : 30}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <ButtonText variant={variant}>{title}</ButtonText>
    </ButtonContainer>
  );
}; 