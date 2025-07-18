import React, { useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from './FormField';

interface PhoneNumberInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
}

const InputContainerInner = styled.View`
  padding: 18px;
  flex-direction: row;
  align-items: center;
`;

const CountryCodeBox = styled.View`
  flex-direction: row;
  align-items: center;
  margin-right: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
`;

const CountryCodeText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  margin-left: 8px;
`;

const PhoneInput = styled.TextInput`
  flex: 1;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  background-color: transparent;
  padding: 0;
`;

export const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder = "Enter phone number",
  error,
}) => {
  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^\d]/g, '');
    onChangeText(cleaned);
  };

  return (
    <FormField label={label} error={error}>
      <InputContainerInner>
        <CountryCodeBox>
          <Ionicons name="flag" size={16} color="rgba(255, 255, 255, 0.7)" />
          <CountryCodeText>+1</CountryCodeText>
        </CountryCodeBox>
        <PhoneInput
          value={value}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          keyboardType="phone-pad"
          autoComplete="tel"
          maxLength={10}
        />
      </InputContainerInner>
    </FormField>
  );
}; 