import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Text, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import styled from 'styled-components/native';
import { Background } from '../components/Background';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '../types/user';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileSection } from '../components/ProfileSection';
import { InfoRow } from '../components/InfoRow';
import { EditInfoModal } from '../components/EditInfoModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { DatePicker } from '../components/DatePicker';
import { PhoneNumberInput } from '../components/PhoneNumberInput';
import { updateUserProfile } from '../api/userService';
import { updateUserPassword } from '../api/authService';
import { API_ENDPOINTS } from '../config/api';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [tempDate, setTempDate] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        if (!accessToken) throw new Error('No access token found');
        const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok && data.success && data.user) {
          setUser({
            ...data.user,
            memberSince: data.user.created_at
          });
        } else {
          throw new Error(data.message || 'Failed to fetch profile');
        }
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveInfo = async (newValue: string) => {
    if (!editingField || !user) return;

    setIsLoading(true);
    setEditingField(null);

    const updates = { [editingField.field]: newValue };
    const { success, data, error } = await updateUserProfile(user.id, updates);
    
    if (success) {
      setUser(data);
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      Alert.alert('Error', error || 'Failed to update profile.');
    }
    setIsLoading(false);
  };

  const handleSavePhone = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { success, data, error } = await updateUserProfile(user.id, { phone: tempPhone });
    
    if (success) {
      setUser({ ...data, memberSince: user.memberSince });
      Alert.alert('Success', 'Phone number updated successfully!');
    } else {
      Alert.alert('Error', error || 'Failed to update phone number.');
    }
    
    setIsEditingPhone(false);
    setIsLoading(false);
  };

  const handleSaveDate = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { success, data, error } = await updateUserProfile(user.id, { date_of_birth: tempDate });
    
    if (success) {
      setUser({ ...data, memberSince: user.memberSince });
      Alert.alert('Success', 'Date of birth updated successfully!');
    } else {
      Alert.alert('Error', error || 'Failed to update date of birth.');
    }
    
    setIsEditingDate(false);
    setIsLoading(false);
  };

  const handlePasswordSave = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setIsPasswordModalVisible(false);

    try {
      const result = await updateUserPassword(currentPassword, newPassword, newPassword);
      
      if (result.success) {
        Alert.alert('Success', 'Password updated successfully!');
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to update password.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while updating password.');
    } finally {
      setIsLoading(false);
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
        <Modal visible={true} transparent animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ 
                  width: '90%', 
                  backgroundColor: 'rgba(40, 40, 40, 0.8)', 
                  borderRadius: 24, 
                  padding: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>
                    Edit Phone Number
                  </Text>
                  <PhoneNumberInput
                    label=""
                    value={tempPhone}
                    onChangeText={setTempPhone}
                    placeholder="Enter phone number"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 }}>
                    <TouchableOpacity 
                      onPress={() => setIsEditingPhone(false)}
                      style={{ padding: 12, marginRight: 16 }}
                    >
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, fontWeight: '600' }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleSavePhone}
                      style={{ padding: 12 }}
                    >
                      <Text style={{ color: '#4facfe', fontSize: 16, fontWeight: '600' }}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {isEditingDate && (
        <Modal visible={true} transparent animationType="fade">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <BlurView intensity={20} tint="dark" style={{ flex: 1 }}>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ 
                  width: '90%', 
                  backgroundColor: 'rgba(40, 40, 40, 0.8)', 
                  borderRadius: 24, 
                  padding: 24,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                }}>
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>
                    Edit Date of Birth
                  </Text>
                  <DatePicker
                    label=""
                    value={tempDate}
                    onChangeText={setTempDate}
                    placeholder="Select date of birth"
                    icon="calendar"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24 }}>
                    <TouchableOpacity 
                      onPress={() => setIsEditingDate(false)}
                      style={{ padding: 12, marginRight: 16 }}
                    >
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 16, fontWeight: '600' }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={handleSaveDate}
                      style={{ padding: 12 }}
                    >
                      <Text style={{ color: '#4facfe', fontSize: 16, fontWeight: '600' }}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </BlurView>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </Background>
  );
}; 