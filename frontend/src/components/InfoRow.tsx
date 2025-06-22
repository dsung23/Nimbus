import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styled from 'styled-components/native';
import { BlurView } from 'expo-blur';

interface InfoRowProps {
  label: string;
  value?: string;
  icon: keyof typeof Ionicons.glyphMap;
  isTappable?: boolean;
  onPress?: () => void;
}

const RowContainer = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  padding: 16px;
  overflow: hidden;
  border-radius: 16px;
  margin-bottom: 12px;
`;

const IconContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  justify-content: center;
  align-items: center;
  margin-right: 16px;
`;

const TextContainer = styled.View`
  flex: 1;
`;

const Label = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`;

const Value = styled.Text`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
`;

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, isTappable, onPress }) => {
  return (
    <RowContainer onPress={onPress} disabled={!isTappable}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <IconContainer>
        <Ionicons name={icon} size={20} color="#fff" />
      </IconContainer>
      <TextContainer>
        <Label>{label}</Label>
        {value && <Value>{value}</Value>}
      </TextContainer>
      {isTappable && <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.5)" />}
    </RowContainer>
  );
}; 