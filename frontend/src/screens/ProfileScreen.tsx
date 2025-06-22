import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import styled from 'styled-components/native';
import { Background } from '../components/Background';
import { useAuth } from '../contexts/AuthContext';

import { User } from '../types/user';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileSection } from '../components/ProfileSection';
import { InfoRow } from '../components/InfoRow';
import { EditInfoModal } from '../components/EditInfoModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { updateUserProfile } from '../api/userService';
import { updateUserPassword } from '../api/authService';

const mockUser: User = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  fullName: 'John Doe',
  email: 'john.doe@email.com',
  phoneNumber: '+1 (555) 123-4567',
  dateOfBirth: '1990-01-15',
  memberSince: '2022-08-20',
};

type EditingField = {
  field: 'email' | 'phoneNumber' | 'dateOfBirth';
  label: string;
  currentValue: string;
};

const Container = styled.View`
  flex: 1;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const LogoutButton = styled(TouchableOpacity)`
  margin: 32px 16px;
  padding: 16px;
  border-radius: 16px;
  background-color: rgba(255, 75, 75, 0.2);
  border: 1px solid rgba(255, 75, 75, 0.4);
  align-items: center;
`;

const LogoutButtonText = styled.Text`
  color: #ff4b4b;
  font-size: 16px;
  font-weight: bold;
`;

export const ProfileScreen: React.FC = () => {
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  useEffect(() => {
    // Simulate loading user data
    setTimeout(() => {
      setUser(mockUser);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSaveInfo = async (newValue: string) => {
    if (!editingField) return;

    setIsLoading(true);
    setEditingField(null);

    const updates = { [editingField.field]: newValue };
    const { success, data } = await updateUserProfile(updates);
    
    if (success) {
      setUser(data);
    } else {
      Alert.alert('Error', 'Failed to update profile.');
    }
    setIsLoading(false);
  };

  const handlePasswordSave = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setIsPasswordModalVisible(false);

    // In a real app, you might validate the currentPassword first
    console.log('Validating current password (placeholder):', currentPassword);

    const { error } = await updateUserPassword(newPassword);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Your password has been changed.');
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('User logged out successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading || !user) {
    return (
      <Background>
        <LoadingContainer>
          <ActivityIndicator size="large" color="#ffffff" />
        </LoadingContainer>
      </Background>
    );
  }

  return (
    <Background>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <ProfileHeader user={user} />
        
        <View style={{ paddingHorizontal: 16 }}>
          <ProfileSection title="Personal Information">
            <InfoRow
              label="Email Address"
              value={user.email}
              icon="mail"
              isTappable
              onPress={() => setEditingField({ field: 'email', label: 'Edit Email Address', currentValue: user.email })}
            />
            <InfoRow
              label="Phone Number"
              value={user.phoneNumber}
              icon="call"
              isTappable
              onPress={() => setEditingField({ field: 'phoneNumber', label: 'Edit Phone Number', currentValue: user.phoneNumber })}
            />
            <InfoRow
              label="Date of Birth"
              value={new Date(user.dateOfBirth).toLocaleDateString()}
              icon="calendar"
              isTappable
              onPress={() => setEditingField({ field: 'dateOfBirth', label: 'Edit Date of Birth', currentValue: user.dateOfBirth })}
            />
          </ProfileSection>

          <ProfileSection title="Account & Security">
            <InfoRow
              label="Change Password"
              icon="lock-closed"
              isTappable
              onPress={() => setIsPasswordModalVisible(true)}
            />
          </ProfileSection>

          <LogoutButton onPress={handleLogout}>
            <LogoutButtonText>Log Out</LogoutButtonText>
          </LogoutButton>
        </View>
      </ScrollView>

      {editingField && (
        <EditInfoModal
          isVisible={!!editingField}
          onClose={() => setEditingField(null)}
          onSave={handleSaveInfo}
          label={editingField.label}
          initialValue={editingField.currentValue}
        />
      )}

      <ChangePasswordModal
        isVisible={isPasswordModalVisible}
        onClose={() => setIsPasswordModalVisible(false)}
        onSave={handlePasswordSave}
      />
    </Background>
  );
}; 