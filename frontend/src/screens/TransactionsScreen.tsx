import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Background } from '../components/Background';

const Container = styled.View`
  flex: 1;
  padding: 20px;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 30px;
`;

const BackButton = styled(TouchableOpacity)`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-right: 16px;
`;

const BackButtonText = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
`;

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
`;

const ContentContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const PlaceholderText = styled.Text`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  text-align: center;
`;

type DashboardStackParamList = {
  DashboardMain: undefined;
  Transactions: undefined;
};

type TransactionsScreenNavigationProp = NativeStackNavigationProp<
  DashboardStackParamList,
  'Transactions'
>;

export const TransactionsScreen: React.FC = () => {
  const navigation = useNavigation<TransactionsScreenNavigationProp>();

  return (
    <Background>
      <Container>
        <Header>
          <BackButton onPress={() => navigation.goBack()}>
            <BackButtonText>←</BackButtonText>
          </BackButton>
          <HeaderTitle>Transactions</HeaderTitle>
        </Header>
        
        <ContentContainer>
          <PlaceholderText>
            Transaction history will be displayed here.
          </PlaceholderText>
        </ContentContainer>
      </Container>
    </Background>
  );
}; 