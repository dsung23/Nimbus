import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await AsyncStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}; 