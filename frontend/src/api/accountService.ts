import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account } from '../types/account';
import { API_ENDPOINTS } from '../config/api';

export interface AccountResponse {
  success: boolean;
  accounts: Account[];
  total: number;
  error?: string;
}

export const getAccounts = async (): Promise<AccountResponse> => {
  try {
    // Get the authentication token
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      throw new Error('No access token found');
    }

    // Make the API call to fetch accounts
    const response = await fetch(API_ENDPOINTS.ACCOUNTS, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Backend accounts response:', data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch accounts');
    }

    // Return the accounts data from the backend
    return { 
      success: true, 
      accounts: data.accounts || [], 
      total: data.total || 0 
    };
  } catch (error) {
    console.error('Account fetch error:', error);
    return { 
      success: false, 
      accounts: [], 
      total: 0,
      error: error instanceof Error ? error.message : 'A network error occurred.' 
    };
  }
}; 