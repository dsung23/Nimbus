import React, { useState } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { GlassmorphicTabBar } from './src/components/GlassmorphicTabBar';
import { AuthNavigator } from './src/navigation/AuthNavigator';

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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Start with auth flow

  const toggleAuth = () => {
    setIsAuthenticated(!isAuthenticated);
  };

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? <AppTabs /> : <AuthNavigator />}
      <DevBypass isAuthenticated={isAuthenticated} onToggle={toggleAuth} />
    </NavigationContainer>
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
