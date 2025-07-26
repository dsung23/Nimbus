import React from 'react';
import { Animated } from 'react-native';
import styled from 'styled-components/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AccountCardProps } from '../types/account';

// Styled components for glassmorphism effect
const CardContainer = styled(Animated.View)`
  width: 320px;
  height: 200px;
  border-radius: 24px;
  margin-horizontal: 4px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 8px;
  shadow-opacity: 0.3;
  shadow-radius: 16px;
  elevation: 12;
`;

const GradientBackground = styled(LinearGradient)`
  flex: 1;
  padding: 24px;
  justify-content: space-between;
`;

const GlassOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const CardHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

const AccountInfo = styled.View`
  flex: 1;
`;

const AccountType = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const AccountName = styled.Text`
  font-size: 18px;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: -0.5px;
`;

const IconContainer = styled.View`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const IconText = styled.Text`
  font-size: 24px;
`;

const CardFooter = styled.View`
  align-items: flex-start;
`;

const BalanceContainer = styled.View`
  margin-bottom: 8px;
`;

const BalanceLabel = styled.Text`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const BalanceAmount = styled.Text`
  font-size: 32px;
  color: #ffffff;
  font-weight: 800;
  letter-spacing: -1px;
`;

const LastFourDigits = styled.Text`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
`;

// Helper function to get account icon
const getAccountIcon = (type: string): string => {
  switch (type) {
    case 'savings': return '💰';
    case 'checking': return '💳';
    case 'credit': return '💳';
    case 'investment': return '📈';
    default: return '🏦';
  }
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const AccountCard: React.FC<AccountCardProps> = ({ account, animatedStyle }) => {
  // Default gradient colors if not provided
  const defaultGradientColors: readonly [string, string] = ['#667eea', '#764ba2'];
  const gradientColors = account.gradientColors || defaultGradientColors;

  return (
    <CardContainer style={animatedStyle}>
      <GradientBackground
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <GlassOverlay />
        
        <CardHeader>
          <AccountInfo>
            <AccountType>{account.type}</AccountType>
            <AccountName>{account.name}</AccountName>
          </AccountInfo>
          <IconContainer>
            <IconText>{getAccountIcon(account.type)}</IconText>
          </IconContainer>
        </CardHeader>
        
        <CardFooter>
          <BalanceContainer>
            <BalanceLabel>Balance</BalanceLabel>
            <BalanceAmount>{formatCurrency(account.balance)}</BalanceAmount>
          </BalanceContainer>
          <LastFourDigits>{account.mask}</LastFourDigits>
        </CardFooter>
      </GradientBackground>
    </CardContainer>
  );
}; 