import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

const API_URL = 'http://localhost:3789/api/auth';

const storeTokens = async (accessToken: string, refreshToken?: string) => {
  try {
    if (typeof accessToken !== 'string' || !accessToken) {
      console.error(
        'Failed to save tokens: Invalid accessToken received.',
        accessToken
      );
      return;
    }
    await AsyncStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }
  } catch (e) {
    console.error('Failed to save tokens to storage', e);
  }
};

export const getTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    return { accessToken, refreshToken };
  } catch (e) {
    console.error('Failed to fetch tokens from storage', e);
    return { accessToken: null, refreshToken: null };
  }
};

export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  } catch (e) {
    console.error('Failed to clear tokens from storage', e);
  }
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: { message: string } | null }> => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('Backend login response:', data);

    if (!response.ok || !data.success) {
      return { user: null, error: { message: data.message || 'Login failed.' } };
    }

    await storeTokens(data.auth?.access_token, data.auth?.refresh_token);
    // The user object from the API should conform to our User type.
    // If not, we might need a mapping function.
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign-in error:', error);
    return { user: null, error: { message: 'A network error occurred.' } };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  userData: {
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string;
  }
): Promise<{ user: User | null; error: { message: string } | null }> => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone: userData.phone,
        date_of_birth: userData.date_of_birth,
      }),
    });

    const data = await response.json();
    console.log('Backend register response:', data);

    if (!response.ok || !data.success) {
      return {
        user: null,
        error: { message: data.message || 'Registration failed.' },
      };
    }

    await storeTokens(data.auth?.access_token, data.auth?.refresh_token);
    // The user object from the API should conform to our User type.
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Sign-up error:', error);
    return { user: null, error: { message: 'A network error occurred.' } };
  }
};

/*
// This function is commented out as there is no corresponding endpoint in the API contract.
export const updateUserPassword = async (
  newPassword: string
): Promise<{ error: { message: string } | null }> => {
  console.log('Simulating API call to update password');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real app, this would be a call to Supabase Auth.
  // e.g., const { error } = await supabase.auth.updateUser({ password: newPassword });

  // Simulate success
  return { error: null };
};
*/ 