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
import { DatePicker } from '../components/DatePicker';
import { PhoneNumberInput } from '../components/PhoneNumberInput';
import { AuthButton } from '../components/AuthButton';
import { Background } from '../components/Background';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { signUpWithEmail } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SignUp'
>;

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

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<SignUpScreenNavigationProp>();
  const { signIn } = useAuth();
  
  // Form state management
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    // Check for required fields
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return false;
    }

    // Validate email format
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return false;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    // Validate phone number (basic check for digits)
    if (phoneNumber.length < 10) {
      setError('Please enter a valid phone number.');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { user, session, error: signUpError } = await signUpWithEmail(
        email,
        password,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phoneNumber.trim(),
          date_of_birth: dateOfBirth.trim(),
        }
      );

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (user && session) {
        // Navigate to TellerConnect screen before signing in, passing the
        // signIn function as a callback to be executed upon success or skip.
        navigation.navigate('TellerConnect', {
          onSuccess: async () => {
            await signIn(user);
          },
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            <HeaderTitle>Create Your Account</HeaderTitle>

            <FormContainer>
              {error && (
                <ErrorContainer>
                  <ErrorText>{error}</ErrorText>
                </ErrorContainer>
              )}

              <AuthInput
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                icon="person"
                autoCapitalize="words"
                autoComplete="off"
              />

              <AuthInput
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                icon="person"
                autoCapitalize="words"
                autoComplete="off"
              />

              <DatePicker
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="Select your date of birth"
                icon="calendar"
              />

              <AuthInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                icon="mail"
                keyboardType="email-address"
                autoComplete="email"
              />

              <PhoneNumberInput
                label="Phone Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
              />

              <AuthInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
                icon="lock-closed"
                autoComplete="password"
              />

              <AuthButton
                title={isLoading ? 'Creating Account...' : 'Create Account'}
                variant="primary"
                onPress={handleSignUp}
              />
            </FormContainer>
          </Container>
        </ScrollView>
      </KeyboardAvoidingView>
    </Background>
  );
}; 