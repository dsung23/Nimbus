import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { updateUserProfile } from '../api/userService';
import { updateUserPassword } from '../api/authService';
import { API_ENDPOINTS } from '../config/api';

type EditingField = {
  field: 'first_name' | 'last_name';
  label: string;
  currentValue: string;
};

export const useUserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [tempPhone, setTempPhone] = useState('');
  const [tempDate, setTempDate] = useState('');

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

  // Auto-fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    // State
    user,
    isLoading,
    editingField,
    isPasswordModalVisible,
    isEditingPhone,
    isEditingDate,
    tempPhone,
    tempDate,
    
    // Actions
    handleSaveInfo,
    handleSavePhone,
    handleSaveDate,
    handlePasswordSave,
    
    // Setters
    setEditingField,
    setIsPasswordModalVisible,
    setIsEditingPhone,
    setIsEditingDate,
    setTempPhone,
    setTempDate,
  };
}; 