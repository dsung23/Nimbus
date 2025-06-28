import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { updateUserProfile } from '../api/userService';
import { updateUserPassword } from '../api/authService';
import { API_ENDPOINTS } from '../config/api';

export const useUserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshProfile = async () => {
    setIsLoading(true);
    setError(null);
    
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
        setUser(data.user);
      } else {
        throw new Error(data.message || 'Failed to fetch profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      setError('No user data available');
      return { success: false, error: 'No user data available' };
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { success: apiSuccess, data, error: apiError } = await updateUserProfile(user.id, updates);
      
      if (apiSuccess) {
        setUser(data);
        setSuccess('Profile updated successfully');
        return { success: true, data };
      } else {
        setError(apiError || 'Failed to update profile');
        return { success: false, error: apiError || 'Failed to update profile' };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateUserPassword(currentPassword, newPassword, newPassword);
      
      if (result.success) {
        setSuccess('Password updated successfully');
        return { success: true };
      } else {
        setError(result.error?.message || 'Failed to update password');
        return { success: false, error: result.error?.message || 'Failed to update password' };
      }
    } catch (err: any) {
      const errorMessage = 'An unexpected error occurred while updating password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Auto-fetch profile on mount
  useEffect(() => {
    refreshProfile();
  }, []);

  return {
    // Domain state
    user,
    isLoading,
    error,
    success,
    
    // Domain actions
    refreshProfile,
    updateProfile,
    changePassword,
    clearMessages,
  };
}; 