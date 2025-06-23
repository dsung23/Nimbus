import React, { ReactNode } from 'react';
import styled from 'styled-components/native';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
}

const FieldContainer = styled.View`
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

const ErrorText = styled.Text`
  font-size: 12px;
  color: #ff4b4b;
  margin-top: 4px;
  margin-left: 4px;
`;

export const FormField: React.FC<FormFieldProps> = ({ label, children, error }) => {
  return (
    <FieldContainer>
      <Label>{label}</Label>
      <InputWrapper>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        {children}
      </InputWrapper>
      {error && <ErrorText>{error}</ErrorText>}
    </FieldContainer>
  );
}; 