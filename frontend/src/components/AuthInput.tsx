import React from 'react';
import { TextInput, View } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';

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
  error?: string;
}

const InputContentWrapper = styled.View`
  flex-direction: row;
  align-items: center;
`;

const StyledTextInput = styled(TextInput)`
  padding: 18px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  flex: 1;
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

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  icon,
  error,
  ...textInputProps
}) => {
  return (
    <FormField label={label} error={error}>
      <InputContentWrapper>
        {icon && (
          <IconContainer>
            <Ionicons name={icon} size={20} color="rgba(255, 255, 255, 0.7)" />
          </IconContainer>
        )}
        <StyledTextInput
          {...textInputProps}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          style={{ paddingLeft: icon ? 50 : 18 }}
        />
      </InputContentWrapper>
    </FormField>
  );
}; 