import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Background } from '../components/Background';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfile } from '../hooks/useUserProfile';

import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileSection } from '../components/ProfileSection';
import { InfoRow } from '../components/InfoRow';
import { EditInfoModal } from '../components/EditInfoModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { PhoneEditModal } from '../components/PhoneEditModal';
import { DateEditModal } from '../components/DateEditModal';

type EditingField = {
  field: 'first_name' | 'last_name';
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
  const { user, isLoading, error, success, updateProfile, changePassword, clearMessages } = useUserProfile();
  
  // UI State
  const [activeModal, setActiveModal] = useState<'name' | 'phone' | 'date' | 'password' | null>(null);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [tempPhone, setTempPhone] = useState('');
  const [tempDate, setTempDate] = useState('');

  // Handle error and success messages
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearMessages();
    }
  }, [error, clearMessages]);

  useEffect(() => {
    if (success) {
      Alert.alert('Success', success);
      clearMessages();
    }
  }, [success, clearMessages]);

  // UI Handlers
  const handleSaveInfo = async (newValue: string) => {
    if (!editingField || !user) return;

    const updates = { [editingField.field]: newValue };
    const result = await updateProfile(updates);
    
    if (result.success) {
      setActiveModal(null);
      setEditingField(null);
    }
  };

  const handleSavePhone = async () => {
    if (!user) return;
    
    const result = await updateProfile({ phone: tempPhone });
    
    if (result.success) {
      setActiveModal(null);
    }
  };

  const handleSaveDate = async () => {
    if (!user) return;
    
    const result = await updateProfile({ date_of_birth: tempDate });
    
    if (result.success) {
      setActiveModal(null);
    }
  };

  const handlePasswordSave = async (currentPassword: string, newPassword: string) => {
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      setActiveModal(null);
    }
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
              label="First Name"
              value={user.first_name}
              icon="person"
              isTappable
              onPress={() => {
                setEditingField({ field: 'first_name', label: 'Edit First Name', currentValue: user.first_name });
                setActiveModal('name');
              }}
            />
            <InfoRow
              label="Last Name"
              value={user.last_name}
              icon="person-outline"
              isTappable
              onPress={() => {
                setEditingField({ field: 'last_name', label: 'Edit Last Name', currentValue: user.last_name });
                setActiveModal('name');
              }}
            />
            <InfoRow
              label="Email Address"
              value={user.email}
              icon="mail"
            />
            <InfoRow
              label="Phone Number"
              value={user.phone}
              icon="call"
              isTappable
              onPress={() => {
                setTempPhone(user.phone);
                setActiveModal('phone');
              }}
            />
            <InfoRow
              label="Date of Birth"
              value={new Date(user.date_of_birth).toLocaleDateString()}
              icon="calendar"
              isTappable
              onPress={() => {
                setTempDate(user.date_of_birth);
                setActiveModal('date');
              }}
            />
          </ProfileSection>

          <ProfileSection title="Account & Security">
            <InfoRow
              label="Change Password"
              icon="lock-closed"
              isTappable
              onPress={() => setActiveModal('password')}
            />
          </ProfileSection>

          <LogoutButton onPress={handleLogout}>
            <LogoutButtonText>Log Out</LogoutButtonText>
          </LogoutButton>
        </View>
      </ScrollView>

      {editingField && activeModal === 'name' && (
        <EditInfoModal
          isVisible={true}
          onClose={() => {
            setActiveModal(null);
            setEditingField(null);
          }}
          onSave={handleSaveInfo}
          label={editingField.label}
          initialValue={editingField.currentValue}
        />
      )}

      {activeModal === 'password' && (
        <ChangePasswordModal
          isVisible={true}
          onClose={() => setActiveModal(null)}
          onSave={handlePasswordSave}
        />
      )}

      {activeModal === 'phone' && (
        <PhoneEditModal
          isVisible={true}
          onClose={() => setActiveModal(null)}
          onSave={handleSavePhone}
          value={tempPhone}
          onChangeText={setTempPhone}
        />
      )}

      {activeModal === 'date' && (
        <DateEditModal
          isVisible={true}
          onClose={() => setActiveModal(null)}
          onSave={handleSaveDate}
          value={tempDate}
          onChangeText={setTempDate}
        />
      )}
    </Background>
  );
}; 