import React from 'react';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthButton } from '../components/AuthButton';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Background } from '../components/Background';

const Container = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const TitleContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const AppTitle = styled.Text`
  font-size: 52px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 2px;
`;

const Tagline = styled.Text`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 12px;
`;

const ButtonContainer = styled.View`
  width: 100%;
  padding: 16px;
`;

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  return (
    <Background>
      <Container>
        <TitleContainer>
          <AppTitle>Nimbus</AppTitle>
          <Tagline>Take control of your finances.</Tagline>
        </TitleContainer>
        <ButtonContainer>
          <AuthButton
            title="Sign Up"
            variant="primary"
            onPress={() => navigation.navigate('SignUp')}
          />
          <AuthButton
            title="Log In"
            variant="secondary"
            onPress={() => navigation.navigate('Login')}
          />
        </ButtonContainer>
      </Container>
    </Background>
  );
}; 