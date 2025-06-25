import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

// NOTE: Replace 192.168.1.XX with your computer's actual local IP address
const API_URL = 'http://192.168.1.7:3789/api/auth';

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<{ success: boolean; data: User; error?: string }> => {
  try {
    const payload = { ...updates, id: userId };
    console.log('Updating user profile with:', payload);

    // Get the authentication token
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    // Make the API call to update profile
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Backend profile update response:', data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update profile');
    }

    // Return the updated user data from the backend
    return { success: true, data: data.user };
  } catch (error) {
    console.error('Profile update error:', error);
    return { 
      success: false, 
      data: {} as User, 
      error: error instanceof Error ? error.message : 'A network error occurred.' 
    };
  }
}; 