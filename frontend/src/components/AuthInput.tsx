import React from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import styled from 'styled-components/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoComplete?: 'email' | 'password' | 'off';
}

const InputContainer = styled.View`
  margin-bottom: 20px;
`;

const Label = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
  font-weight: 500;
`;

const InputWrapper = styled.View`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const StyledTextInput = styled(TextInput)`
  padding: 18px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
`;

const IconContainer = styled.View`
  position: absolute;
  left: 18px;
  top: 0;
  bottom: 0;
  justify-content: center;
  align-items: center;
  width: 20px;
`;

const ErrorText = styled.Text`
  font-size: 12px;
  color: #ff4b4b;
  margin-top: 4px;
  margin-left: 4px;
`;

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  icon,
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoComplete = 'off',
}) => {
  return (
    <InputContainer>
      <Label>{label}</Label>
      <InputWrapper>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        {icon && (
          <IconContainer>
            <Ionicons name={icon} size={20} color="rgba(255, 255, 255, 0.7)" />
          </IconContainer>
        )}
        <StyledTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          autoComplete={autoComplete}
          style={{ paddingLeft: icon ? 50 : 18 }}
        />
      </InputWrapper>
    </InputContainer>
  );
}; 