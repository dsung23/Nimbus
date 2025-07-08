import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for stored user data
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const signIn = async (userData: User) => {
    try {
      // Store user data
      await storeUser(userData);
      setUser(userData);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear stored user data
      await clearStoredUser();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions for storing/retrieving user data
const storeUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    console.log('Stored user data:', user);
  } catch (error) {
    console.error('Failed to store user data:', error);
    throw error;
  }
};

const getStoredUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      console.log('Retrieved stored user data:', user);
      return user;
    }
    return null;
  } catch (error) {
    console.error('Failed to retrieve stored user data:', error);
    return null;
  }
};

const clearStoredUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('user');
    console.log('Cleared stored user data');
  } catch (error) {
    console.error('Failed to clear stored user data:', error);
    throw error;
  }
}; 