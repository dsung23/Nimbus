import React from 'react';
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
  const {
    user,
    isLoading,
    editingField,
    isPasswordModalVisible,
    isEditingPhone,
    isEditingDate,
    tempPhone,
    tempDate,
    handleSaveInfo,
    handleSavePhone,
    handleSaveDate,
    handlePasswordSave,
    setEditingField,
    setIsPasswordModalVisible,
    setIsEditingPhone,
    setIsEditingDate,
    setTempPhone,
    setTempDate,
  } = useUserProfile();

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
              onPress={() => setEditingField({ field: 'first_name', label: 'Edit First Name', currentValue: user.first_name })}
            />
            <InfoRow
              label="Last Name"
              value={user.last_name}
              icon="person-outline"
              isTappable
              onPress={() => setEditingField({ field: 'last_name', label: 'Edit Last Name', currentValue: user.last_name })}
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
                setIsEditingPhone(true);
              }}
            />
            <InfoRow
              label="Date of Birth"
              value={new Date(user.date_of_birth).toLocaleDateString()}
              icon="calendar"
              isTappable
              onPress={() => {
                setTempDate(user.date_of_birth);
                setIsEditingDate(true);
              }}
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

      {isEditingPhone && (
        <PhoneEditModal
          isVisible={isEditingPhone}
          onClose={() => setIsEditingPhone(false)}
          onSave={handleSavePhone}
          value={tempPhone}
          onChangeText={setTempPhone}
        />
      )}

      {isEditingDate && (
        <DateEditModal
          isVisible={isEditingDate}
          onClose={() => setIsEditingDate(false)}
          onSave={handleSaveDate}
          value={tempDate}
          onChangeText={setTempDate}
        />
      )}
    </Background>
  );
}; 