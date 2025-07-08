import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { API_ENDPOINTS } from '../config/api';

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
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('Backend login response:', data);

    if (!response.ok || !data.success) {
      // Handle backend validation errors
      if (data.errors && Array.isArray(data.errors)) {
        // Backend returned field-specific validation errors
        const errorMessages = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        return { user: null, error: { message: `Validation failed: ${errorMessages}` } };
      }
      
      // Handle other backend errors
      return { user: null, error: { message: data.message || 'Login failed.' } };
    }

    await storeTokens(data.auth?.access_token, data.auth?.refresh_token);

    // Map the raw user object from the API to our User type
    const rawUser = data.user;
    const mappedUser: User = {
      id: rawUser?.id || '',
      first_name: rawUser?.first_name || '',
      last_name: rawUser?.last_name || '',
      email: rawUser?.email || '',
      phone: rawUser?.phone || '',
      date_of_birth: rawUser?.date_of_birth || '',
      is_active: rawUser?.is_active,
      created_at: rawUser?.created_at,
    };

    return { user: mappedUser, error: null };
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
    const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
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
      // Handle backend validation errors
      if (data.errors && Array.isArray(data.errors)) {
        // Backend returned field-specific validation errors
        const errorMessages = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
        return {
          user: null,
          error: { message: `Validation failed: ${errorMessages}` },
        };
      }
      
      // Handle other backend errors
      return {
        user: null,
        error: { message: data.message || 'Registration failed.' },
      };
    }

    // Store tokens if available in the auth object
    if (data.auth?.session?.access_token) {
      await storeTokens(data.auth.session.access_token, data.auth.session.refresh_token);
    }

    // Map the backend user object to our User type
    const rawUser = data.user;
    const mappedUser: User = {
      id: rawUser?.id || '',
      first_name: rawUser?.first_name || '',
      last_name: rawUser?.last_name || '',
      email: rawUser?.email || '',
      phone: rawUser?.phone || '',
      date_of_birth: rawUser?.date_of_birth || '',
      is_active: rawUser?.is_active,
      created_at: rawUser?.created_at,
    };

    return { user: mappedUser, error: null };
  } catch (error) {
    console.error('Sign-up error:', error);
    return { user: null, error: { message: 'A network error occurred.' } };
  }
};

export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ success: boolean; error?: { message: string } }> => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      return { 
        success: false, 
        error: { message: 'No access token found. Please log in again.' } 
      };
    }

    const response = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json();
    console.log('Backend password update response:', data);

    if (!response.ok || !data.success) {
      return { 
        success: false, 
        error: { message: data.message || 'Failed to update password.' } 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Password update error:', error);
    return { 
      success: false, 
      error: { message: 'A network error occurred.' } 
    };
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