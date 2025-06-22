import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GlassmorphicTabBar } from './src/components/GlassmorphicTabBar';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { User } from './src/types/user';

const Tab = createBottomTabNavigator();

const AppTabs: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <GlassmorphicTabBar {...props} />}
    screenOptions={{
      headerShown: false,
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Development bypass component
const DevBypass: React.FC<{ isAuthenticated: boolean; onToggle: () => void }> = ({ 
  isAuthenticated, 
  onToggle 
}) => (
  <TouchableOpacity style={styles.devBypass} onPress={onToggle}>
    <Text style={styles.devBypassText}>
      {isAuthenticated ? '🔓 Dev: Logout' : '🔒 Dev: Login'}
    </Text>
  </TouchableOpacity>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, signOut, signIn } = useAuth();

  const toggleAuth = async () => {
    if (isAuthenticated) {
      await signOut();
    } else {
      // For dev bypass, simulate a login with mock user
      const mockUser: User = {
        id: 'dev-user-123',
        fullName: 'Dev User',
        email: 'dev@example.com',
        phoneNumber: '+1 (555) 123-4567',
        dateOfBirth: '1990-01-01',
        memberSince: '2024-01-01',
      };
      
      try {
        await signIn(mockUser);
        console.log('Dev bypass: signed in as', mockUser.fullName);
      } catch (error) {
        console.error('Dev bypass: failed to sign in', error);
      }
    }
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? <AppTabs /> : <AuthNavigator />}
      <DevBypass isAuthenticated={isAuthenticated} onToggle={toggleAuth} />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  devBypass: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  devBypassText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
