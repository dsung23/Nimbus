import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AccountCarousel } from '../components/AccountCarousel';
import { Account, DashboardState } from '../types/account';
import { Background } from '../components/Background';
import { getAccounts } from '../api/accountService';

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
  align-items: center;
  margin-bottom: 30px;
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

const TransactionsButton = styled(TouchableOpacity)`
  margin-top: 24px;
  padding: 16px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  align-items: center;
`;

const TransactionsButtonText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
`;

type DashboardStackParamList = {
  DashboardMain: undefined;
  Transactions: undefined;
};

type DashboardScreenNavigationProp = NativeStackNavigationProp<
  DashboardStackParamList,
  'DashboardMain'
>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [state, setState] = useState<DashboardState>({
    accounts: [],
    isLoading: true,
    error: null,
  });

  // Load real account data from backend
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await getAccounts();
        
        if (response.success) {
          setState({
            accounts: response.accounts,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            accounts: [],
            isLoading: false,
            error: response.error || 'Failed to load accounts. Please try again.',
          });
        }
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
      <Background>
        <LoadingContainer>
          <ActivityIndicator size="large" color="#ffffff" />
        </LoadingContainer>
      </Background>
    );
  }

  if (state.error) {
    return (
      <Background>
        <ErrorContainer>
          <ErrorText>{state.error}</ErrorText>
        </ErrorContainer>
      </Background>
    );
  }

  const handleTransactionsPress = () => {
    navigation.navigate('Transactions');
  };

  return (
    <Background>
      <ScrollContainer showsVerticalScrollIndicator={false}>
        <Header>
          <HeaderTitle>Dashboard</HeaderTitle>
        </Header>

        <SectionTitle>Your Accounts</SectionTitle>
        
        <AccountCarousel accounts={state.accounts} />
        
        <TransactionsButton onPress={handleTransactionsPress}>
          <TransactionsButtonText>View Recent Transactions →</TransactionsButtonText>
        </TransactionsButton>
      </ScrollContainer>
    </Background>
  );
}; 