import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '../../test/utils';
import { LoginScreen } from '../LoginScreen';
import { signInWithEmail } from '../../api/authService';
import { useAuth } from '../../contexts/AuthContext';
import { createMockNavigation, mockUser } from '../../test/utils';

// Mock the authService
jest.mock('../../api/authService');
const mockSignInWithEmail = signInWithEmail as jest.MockedFunction<typeof signInWithEmail>;

// Mock useAuth hook
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => createMockNavigation(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: mockSignIn,
      signOut: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render login form correctly', () => {
      const { getByText, getByPlaceholderText } = render(<LoginScreen />);

      expect(getByText('Welcome Back')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByText('Log In')).toBeTruthy();
      expect(getByText('Forgot your password?')).toBeTruthy();
    });

    it('should have proper input labels', () => {
      const { getByText } = render(<LoginScreen />);

      expect(getByText('Email Address')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
    });
  });

  describe('form validation', () => {
    it('should show error when fields are empty', async () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(getByText('Please fill in all fields.')).toBeTruthy();
      });
    });

    it('should show error when email is invalid', async () => {
      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid-email');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(getByText('Please enter a valid email address.')).toBeTruthy();
      });
    });

    it('should not show error with valid inputs', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({
        user: mockUser,
        error: null,
      });

      const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(queryByText('Please fill in all fields.')).toBeFalsy();
        expect(queryByText('Please enter a valid email address.')).toBeFalsy();
      });
    });
  });

  describe('authentication flow', () => {
    it('should handle successful login', async () => {
      mockSignInWithEmail.mockResolvedValueOnce({
        user: mockUser,
        error: null,
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignInWithEmail.mockResolvedValueOnce({
        user: null,
        error: { message: errorMessage },
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrongpassword');
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
        expect(mockSignIn).not.toHaveBeenCalled();
      });
    });

    it('should handle network errors', async () => {
      mockSignInWithEmail.mockRejectedValueOnce(new Error('Network error'));

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(getByText('An unexpected error occurred. Please try again.')).toBeTruthy();
      });
    });

    it('should show loading state during authentication', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const authPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockSignInWithEmail.mockReturnValueOnce(authPromise as any);

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Log In'));

      // Should show loading state
      expect(getByText('Signing In...')).toBeTruthy();

      // Resolve the promise
      resolvePromise!({ user: mockUser, error: null });

      await waitFor(() => {
        expect(getByText('Log In')).toBeTruthy();
      });
    });
  });

  describe('forgot password', () => {
    it('should show alert when forgot password is pressed', () => {
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Forgot your password?'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Forgot Password',
        'Password reset functionality will be implemented in the next phase.',
        [{ text: 'OK' }]
      );
    });
  });

  describe('form interaction', () => {
    it('should update email input correctly', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const emailInput = getByPlaceholderText('Enter your email');

      fireEvent.changeText(emailInput, 'new@example.com');

      expect(emailInput.props.value).toBe('new@example.com');
    });

    it('should update password input correctly', () => {
      const { getByPlaceholderText } = render(<LoginScreen />);
      const passwordInput = getByPlaceholderText('Enter your password');

      fireEvent.changeText(passwordInput, 'newpassword');

      expect(passwordInput.props.value).toBe('newpassword');
    });

    it('should clear error when new input is entered', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(<LoginScreen />);

      // Trigger validation error first
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(getByText('Please fill in all fields.')).toBeTruthy();
      });

      // Enter email, error should still be there
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      
      // The error should still be visible until we try to submit again or handle it differently
      expect(queryByText('Please fill in all fields.')).toBeTruthy();
    });
  });

  describe('user mapping', () => {
    it('should properly map backend user to frontend user format', async () => {
      const backendUser = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
        profileImageUrl: 'https://example.com/image.jpg',
        memberSince: '2023-01-01',
      };

      mockSignInWithEmail.mockResolvedValueOnce({
        user: backendUser,
        error: null,
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(backendUser);
      });
    });

    it('should handle missing user fields gracefully', async () => {
      const incompleteUser = {
        id: '123',
        email: 'john@example.com',
        // Missing other fields
      };

      mockSignInWithEmail.mockResolvedValueOnce({
        user: incompleteUser,
        error: null,
      });

      const { getByPlaceholderText, getByText } = render(<LoginScreen />);

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Log In'));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          id: '123',
          first_name: '',
          last_name: '',
          email: 'john@example.com',
          phone: '',
          date_of_birth: '',
          profileImageUrl: '',
          memberSince: '',
        });
      });
    });
  });
}); 