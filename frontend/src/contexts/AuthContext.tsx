import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        // In a real app, you would check for an existing session
        // e.g., const session = await supabase.auth.getSession();
        
        // For now, we'll simulate checking for a stored session
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
      // Store user data (in a real app, you'd store the session)
      await storeUser(userData);
      setUser(userData);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear stored user data (in a real app, you'd sign out from Supabase)
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
// In a real app, you'd use AsyncStorage or SecureStore
const storeUser = async (user: User): Promise<void> => {
  // Simulate storing user data
  console.log('Storing user data:', user);
  // In a real app: await AsyncStorage.setItem('user', JSON.stringify(user));
};

const getStoredUser = async (): Promise<User | null> => {
  // Simulate retrieving user data
  console.log('Retrieving stored user data');
  // In a real app: const userData = await AsyncStorage.getItem('user');
  // return userData ? JSON.parse(userData) : null;
  return null; // For now, always return null to start fresh
};

const clearStoredUser = async (): Promise<void> => {
  // Simulate clearing user data
  console.log('Clearing stored user data');
  // In a real app: await AsyncStorage.removeItem('user');
}; 