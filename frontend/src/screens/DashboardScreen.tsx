import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import styled from 'styled-components/native';
import { AccountCarousel } from '../components/AccountCarousel';
import { Account, DashboardState } from '../types/account';

// Styled components for glassmorphism dashboard
const Container = styled.View`
  flex: 1;
`;

const ScrollContainer = styled(ScrollView)`
  flex: 1;
  padding: 20px;
`;

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-top: 20px;
`;

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
`;

const AvatarContainer = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const AvatarText = styled.Text`
  font-size: 18px;
  color: #ffffff;
  font-weight: 600;
`;

const SectionTitle = styled.Text`
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 16px;
  letter-spacing: -0.5px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const ErrorContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ErrorText = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 24px;
`;

// Mock data with gradient colors for the carousel
const mockAccounts: Account[] = [
  {
    id: '1',
    type: 'Savings',
    name: 'Primary Savings',
    balance: 15420.75,
    lastFourDigits: '1234',
    gradientColors: ['#667eea', '#764ba2'] as const,
  },
  {
    id: '2',
    type: 'Checking',
    name: 'Main Checking',
    balance: 3245.50,
    lastFourDigits: '5678',
    gradientColors: ['#f093fb', '#f5576c'] as const,
  },
  {
    id: '3',
    type: 'Credit',
    name: 'Chase Freedom',
    balance: 8749.70,
    lastFourDigits: '9012',
    gradientColors: ['#4facfe', '#00f2fe'] as const,
  },
  {
    id: '4',
    type: 'Savings',
    name: 'Emergency Fund',
    balance: 8500.00,
    lastFourDigits: '3456',
    gradientColors: ['#43e97b', '#38f9d7'] as const,
  },
];

export const DashboardScreen: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    accounts: [],
    isLoading: true,
    error: null,
  });

  // Simulate loading data
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setState({
          accounts: mockAccounts,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          accounts: [],
          isLoading: false,
          error: 'Failed to load accounts. Please try again.',
        });
      }
    };

    loadAccounts();
  }, []);

  if (state.isLoading) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LoadingContainer>
          <ActivityIndicator size="large" color="#ffffff" />
        </LoadingContainer>
      </LinearGradient>
    );
  }

  if (state.error) {
    return (
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={{ flex: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ErrorContainer>
          <ErrorText>{state.error}</ErrorText>
        </ErrorContainer>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Overlay gradient for glassmorphism effect */}
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.3)']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      <ScrollContainer showsVerticalScrollIndicator={false}>
        <Header>
          <HeaderTitle>Dashboard</HeaderTitle>
          <AvatarContainer>
            <AvatarText>👤</AvatarText>
          </AvatarContainer>
        </Header>

        <SectionTitle>Your Accounts</SectionTitle>
        
        <AccountCarousel accounts={state.accounts} />
      </ScrollContainer>
    </LinearGradient>
  );
}; 