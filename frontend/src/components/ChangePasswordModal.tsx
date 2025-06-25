import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import styled from 'styled-components/native';

interface ChangePasswordModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
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
  margin-bottom: 16px;
`;

const ErrorText = styled.Text`
  color: #ff4b4b;
  margin-bottom: 16px;
  text-align: center;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-top: 8px;
`;

const Button = styled(TouchableOpacity)`
  padding: 12px 20px;
  margin-left: 16px;
`;

const ButtonText = styled.Text`
  font-size: 16px;
  font-weight: 600;
`;

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    // Check for password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }
    setError('');
    onSave(currentPassword, newPassword);
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <BlurView intensity={20} tint="dark" style={styles.blurView}>
          <ModalContainer>
            <ModalContent>
              <ModalTitle>Change Password</ModalTitle>
              <Input
                placeholder="Current Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <Input
                placeholder="New Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Input
                placeholder="Confirm New Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                secureTextEntry
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />
              {error ? <ErrorText>{error}</ErrorText> : null}
              <ButtonContainer>
                <Button onPress={handleClose}>
                  <ButtonText style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cancel</ButtonText>
                </Button>
                <Button onPress={handleSave}>
                  <ButtonText style={{ color: '#4facfe' }}>Save Changes</ButtonText>
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