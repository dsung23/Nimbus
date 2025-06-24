import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
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

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { user, error: authError } = await signInWithEmail(email, password);

      if (authError) {
        setError(authError.message);
        return;
      }

      if (user) {
        // Map backend user to frontend User type, filling missing fields
        const mappedUser = {
          id: user.id || '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          date_of_birth: user.date_of_birth || '',
          profileImageUrl: user.profileImageUrl || '',
          memberSince: user.memberSince || '',
        };
        await signIn(mappedUser);
        console.log('User logged in successfully:', mappedUser.email);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be implemented in the next phase.',
      [{ text: 'OK' }]
    );
  };

  return (
    <Background>
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
              {error && (
                <ErrorContainer>
                  <ErrorText>{error}</ErrorText>
                </ErrorContainer>
              )}

              <AuthInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                icon="mail"
                keyboardType="email-address"
                autoComplete="email"
              />

              <AuthInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                icon="lock-closed"
                autoComplete="password"
              />

              <AuthButton
                title={isLoading ? 'Signing In...' : 'Log In'}
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