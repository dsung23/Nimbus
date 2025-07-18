import React, { useState } from 'react';
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
import { DatePicker } from '../components/DatePicker';
import { PhoneNumberInput } from '../components/PhoneNumberInput';
import { AuthButton } from '../components/AuthButton';
import { Background } from '../components/Background';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { signUpWithEmail } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';
import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateDateOfBirth,
} from '../utils/validation';

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'SignUp'
>;

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
  margin-top: 44px;
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
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Check for required fields
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    } else {
      const nameValidation = validateName(firstName.trim());
      if (!nameValidation.isValid) {
        errors.firstName = nameValidation.message!;
      }
    }
    
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else {
      const nameValidation = validateName(lastName.trim());
      if (!nameValidation.isValid) {
        errors.lastName = nameValidation.message!;
      }
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneValidation = validatePhone(phone.trim());
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.message!;
      }
    }
    
    if (!dateOfBirth.trim()) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const dateValidation = validateDateOfBirth(dateOfBirth.trim());
      if (!dateValidation.isValid) {
        errors.dateOfBirth = dateValidation.message!;
      }
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message!;
      }
    }
    
    setFieldErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors above before continuing.');
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
    setFieldErrors({});

    try {
      const { user, error: signUpError } = await signUpWithEmail(
        email.trim(),
        password,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          date_of_birth: dateOfBirth.trim(),
        }
      );

      if (signUpError) {
        // Handle backend validation errors
        if (signUpError.message.includes('Validation failed') || signUpError.message.includes('errors')) {
          // This would be handled by the enhanced error handling in authService
          setError(signUpError.message);
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (user) {
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

  const handleFirstNameChange = (text: string) => {
    setFirstName(text);
    if (fieldErrors.firstName) {
      setFieldErrors(prev => ({ ...prev, firstName: '' }));
    }
    if (error) {
      setError(null);
    }
  };

  const handleLastNameChange = (text: string) => {
    setLastName(text);
    if (fieldErrors.lastName) {
      setFieldErrors(prev => ({ ...prev, lastName: '' }));
    }
    if (error) {
      setError(null);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
    if (error) {
      setError(null);
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    if (fieldErrors.phone) {
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    }
    if (error) {
      setError(null);
    }
  };

  const handleDateOfBirthChange = (text: string) => {
    setDateOfBirth(text);
    if (fieldErrors.dateOfBirth) {
      setFieldErrors(prev => ({ ...prev, dateOfBirth: '' }));
    }
    if (error) {
      setError(null);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
    if (error) {
      setError(null);
    }
  };

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
                onChangeText={handleFirstNameChange}
                placeholder="Enter your first name"
                icon="person"
                autoCapitalize="words"
                autoComplete="off"
                error={fieldErrors.firstName}
              />

              <AuthInput
                label="Last Name"
                value={lastName}
                onChangeText={handleLastNameChange}
                placeholder="Enter your last name"
                icon="person"
                autoCapitalize="words"
                autoComplete="off"
                error={fieldErrors.lastName}
              />

              <DatePicker
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={handleDateOfBirthChange}
                placeholder="Select your date of birth"
                icon="calendar"
                error={fieldErrors.dateOfBirth}
              />

              <AuthInput
                label="Email Address"
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                icon="mail"
                keyboardType="email-address"
                autoComplete="email"
                error={fieldErrors.email}
              />

              <PhoneNumberInput
                label="Phone Number"
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="Enter your phone number"
                error={fieldErrors.phone}
              />

              <AuthInput
                label="Password"
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="Create a password"
                secureTextEntry
                icon="lock-closed"
                autoComplete="password"
                error={fieldErrors.password}
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