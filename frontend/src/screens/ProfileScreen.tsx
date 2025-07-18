import React, { useState, useEffect, useCallback } from 'react';
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
  const [tempData, setTempData] = useState({ phone: '', date: '' });

  // Handle error and success messages
  useEffect(() => {
    if (success) {
      Alert.alert('Success', success);
      clearMessages();
    } else if (error) {
      Alert.alert('Error', error);
      clearMessages();
    }
  }, [error, success, clearMessages]);

  // UI Handlers
  const handleSaveInfo = useCallback(async (newValue: string) => {
    if (!editingField || !user) return;

    const updates = { [editingField.field]: newValue };
    const result = await updateProfile(updates);
    
    if (result.success) {
      setActiveModal(null);
      setEditingField(null);
    }
  }, [editingField, user, updateProfile]);

  const handleSavePhone = useCallback(async () => {
    if (!user) return;
    
    const result = await updateProfile({ phone: tempData.phone });
    
    if (result.success) {
      setActiveModal(null);
    }
  }, [user, tempData.phone, updateProfile]);

  const handleSaveDate = useCallback(async () => {
    if (!user) return;
    
    const result = await updateProfile({ date_of_birth: tempData.date });
    
    if (result.success) {
      setActiveModal(null);
    }
  }, [user, tempData.date, updateProfile]);

  const handlePasswordSave = useCallback(async (currentPassword: string, newPassword: string) => {
    const result = await changePassword(currentPassword, newPassword);
    
    if (result.success) {
      setActiveModal(null);
    }
  }, [changePassword]);

  const handleLogout = useCallback(async () => {
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
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  }, [signOut]);

  const openFirstNameModal = useCallback(() => {
    if (!user) return;
    setEditingField({ field: 'first_name', label: 'Edit First Name', currentValue: user.first_name });
    setActiveModal('name');
  }, [user]);

  const openLastNameModal = useCallback(() => {
    if (!user) return;
    setEditingField({ field: 'last_name', label: 'Edit Last Name', currentValue: user.last_name });
    setActiveModal('name');
  }, [user]);

  const openPhoneModal = useCallback(() => {
    if (!user) return;
    setTempData(prev => ({ ...prev, phone: user.phone }));
    setActiveModal('phone');
  }, [user]);

  const openDateModal = useCallback(() => {
    if (!user) return;
    setTempData(prev => ({ ...prev, date: user.date_of_birth }));
    setActiveModal('date');
  }, [user]);

  const openPasswordModal = useCallback(() => {
    setActiveModal('password');
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEditingField(null);
  }, []);

  const handlePhoneChange = useCallback((phone: string) => {
    setTempData(prev => ({ ...prev, phone }));
  }, []);

  const handleDateChange = useCallback((date: string) => {
    setTempData(prev => ({ ...prev, date }));
  }, []);

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
              onPress={openFirstNameModal}
            />
            <InfoRow
              label="Last Name"
              value={user.last_name}
              icon="person-outline"
              isTappable
              onPress={openLastNameModal}
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
              onPress={openPhoneModal}
            />
            <InfoRow
              label="Date of Birth"
              value={new Date(user.date_of_birth).toLocaleDateString()}
              icon="calendar"
              isTappable
              onPress={openDateModal}
            />
          </ProfileSection>

          <ProfileSection title="Account & Security">
            <InfoRow
              label="Change Password"
              icon="lock-closed"
              isTappable
              onPress={openPasswordModal}
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
          onClose={closeModal}
          onSave={handleSaveInfo}
          label={editingField.label}
          initialValue={editingField.currentValue}
        />
      )}

      {activeModal === 'password' && (
        <ChangePasswordModal
          isVisible={true}
          onClose={closeModal}
          onSave={handlePasswordSave}
        />
      )}

      {activeModal === 'phone' && (
        <PhoneEditModal
          isVisible={true}
          onClose={closeModal}
          onSave={handleSavePhone}
          value={tempData.phone}
          onChangeText={handlePhoneChange}
        />
      )}

      {activeModal === 'date' && (
        <DateEditModal
          isVisible={true}
          onClose={closeModal}
          onSave={handleSaveDate}
          value={tempData.date}
          onChangeText={handleDateChange}
        />
      )}
    </Background>
  );
}; 