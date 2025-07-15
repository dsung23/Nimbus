import React, { useState, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import { Background } from '../components/Background';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { signInWithEmail } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.View`
  flex: 1;
  justify-content: center;
  padding: 24px;
`;

const BackButtonContainer = styled.View`
  position: absolute;
  top: 60px;
  left: 24px;
  z-index: 10;
`;

const BackButton = styled(TouchableOpacity)`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
`;

const BackButtonText = styled.Text`
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
`;

const HeaderTitle = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-bottom: 40px;
  letter-spacing: -0.5px;
`;

const FormContainer = styled.View`
  width: 100%;
`;

const ErrorContainer = styled.View`
  background-color: rgba(255, 75, 75, 0.2);
  border: 1px solid rgba(255, 75, 75, 0.4);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
`;

const ErrorText = styled.Text`
  color: #ff4b4b;
  font-size: 14px;
  text-align: center;
`;

const ForgotPasswordLink = styled.Text`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: center;
  margin-top: 20px;
  text-decoration-line: underline;
`;

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

interface LoginState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}

const validateInput = (credentials: Omit<LoginState, 'isLoading' | 'error'>): string | null => {
  const { email, password } = credentials;
  if (!email.trim() || !password.trim()) {
    return 'Please fill in all fields.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address.';
  }
  return null;
};

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn } = useAuth();
  
  const [state, setState] = useState<LoginState>({
    email: '',
    password: '',
    isLoading: false,
    error: null,
  });

  const handleInputChange = useCallback((field: keyof LoginState) => (value: string) => {
    setState(prevState => ({ ...prevState, [field]: value, error: null }));
  }, []);

  const handleLogin = useCallback(async () => {
    const validationError = validateInput(state);
    if (validationError) {
      setState(prevState => ({ ...prevState, error: validationError }));
      return;
    }

    setState(prevState => ({ ...prevState, isLoading: true, error: null }));

    try {
      const { user, error: authError } = await signInWithEmail(state.email, state.password);

      if (authError) {
        setState(prevState => ({ ...prevState, error: "The email or password you entered is incorrect.", isLoading: false }));
        return;
      }

      if (user) {
        await signIn(user);
      }
    } catch (err) {
      setState(prevState => ({ ...prevState, error: 'An unexpected error occurred. Please try again.', isLoading: false }));
    }
  }, [state, signIn]);

  const handleForgotPassword = useCallback(() => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be implemented in the next phase.',
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <Background>
      <BackButtonContainer>
        <BackButton onPress={() => navigation.goBack()}>
          <BackButtonText>←</BackButtonText>
        </BackButton>
      </BackButtonContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <Container>
            <HeaderTitle>Welcome Back</HeaderTitle>

            <FormContainer>
              {state.error && (
                <ErrorContainer>
                  <ErrorText>{state.error}</ErrorText>
                </ErrorContainer>
              )}

              <AuthInput
                label="Email Address"
                value={state.email}
                onChangeText={handleInputChange('email')}
                placeholder="Enter your email"
                icon="mail"
                keyboardType="email-address"
                autoComplete="email"
              />

              <AuthInput
                label="Password"
                value={state.password}
                onChangeText={handleInputChange('password')}
                placeholder="Enter your password"
                secureTextEntry
                icon="lock-closed"
                autoComplete="password"
              />

              <AuthButton
                title={state.isLoading ? 'Signing In...' : 'Log In'}
                variant="primary"
                onPress={handleLogin}
              />

              <ForgotPasswordLink onPress={handleForgotPassword}>
                Forgot your password?
              </ForgotPasswordLink>
            </FormContainer>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
}; 