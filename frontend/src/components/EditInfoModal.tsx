import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import styled from 'styled-components/native';

interface EditInfoModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (newValue: string) => void;
  label: string;
  initialValue: string;
}

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.View`
  width: 90%;
  background-color: rgba(40, 40, 40, 0.8);
  border-radius: 24px;
  padding: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ModalTitle = styled.Text`
  color: #fff;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 24px;
`;

const Input = styled.TextInput`
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  margin-bottom: 24px;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;

const Button = styled(TouchableOpacity)`
  padding: 12px 20px;
  margin-left: 16px;
`;

const ButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
`;

export const EditInfoModal: React.FC<EditInfoModalProps> = ({
  isVisible,
  onClose,
  onSave,
  label,
  initialValue,
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isVisible) {
      setValue(initialValue);
    }
  }, [isVisible, initialValue]);

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <BlurView intensity={20} tint="dark" style={styles.blurView}>
          <ModalContainer>
            <ModalContent>
              <ModalTitle>{label}</ModalTitle>
              <Input
                value={value}
                onChangeText={setValue}
                autoFocus
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
              <ButtonContainer>
                <Button onPress={onClose}>
                  <ButtonText style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cancel</ButtonText>
                </Button>
                <Button onPress={() => onSave(value)}>
                  <ButtonText style={{ color: '#4facfe' }}>Save</ButtonText>
                </Button>
              </ButtonContainer>
            </ModalContent>
          </ModalContainer>
        </BlurView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurView: {
    flex: 1,
  },
}); 