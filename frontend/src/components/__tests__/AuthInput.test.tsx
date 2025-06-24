import React from 'react';
import { render, fireEvent } from '../../test/utils';
import { AuthInput } from '../AuthInput';

describe('AuthInput', () => {
  const mockOnChangeText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with basic props', () => {
      const { getByPlaceholderText, getByText } = render(
        <AuthInput
          label="Test Label"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Test placeholder"
        />
      );

      expect(getByText('Test Label')).toBeTruthy();
      expect(getByPlaceholderText('Test placeholder')).toBeTruthy();
    });

    it('should render with icon', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
          icon="mail"
        />
      );

      expect(getByPlaceholderText('Enter email')).toBeTruthy();
    });

    it('should display current value', () => {
      const { getByDisplayValue } = render(
        <AuthInput
          label="Email"
          value="test@example.com"
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
        />
      );

      expect(getByDisplayValue('test@example.com')).toBeTruthy();
    });

    it('should render with error message', () => {
      const { getByText } = render(
        <AuthInput
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
          error="This field is required"
        />
      );

      expect(getByText('This field is required')).toBeTruthy();
    });
  });

  describe('interaction', () => {
    it('should call onChangeText when text changes', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
        />
      );

      const input = getByPlaceholderText('Enter email');
      fireEvent.changeText(input, 'test@example.com');

      expect(mockOnChangeText).toHaveBeenCalledWith('test@example.com');
    });

    it('should handle multiple text changes', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
        />
      );

      const input = getByPlaceholderText('Enter email');
      fireEvent.changeText(input, 'test');
      fireEvent.changeText(input, 'test@');
      fireEvent.changeText(input, 'test@example.com');

      expect(mockOnChangeText).toHaveBeenCalledTimes(3);
      expect(mockOnChangeText).toHaveBeenNthCalledWith(1, 'test');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(2, 'test@');
      expect(mockOnChangeText).toHaveBeenNthCalledWith(3, 'test@example.com');
    });
  });

  describe('props handling', () => {
    it('should handle secure text entry', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Password"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter password"
          secureTextEntry={true}
        />
      );

      const input = getByPlaceholderText('Enter password');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('should handle keyboard type', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
          keyboardType="email-address"
        />
      );

      const input = getByPlaceholderText('Enter email');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('should handle auto capitalize', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Name"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter name"
          autoCapitalize="words"
        />
      );

      const input = getByPlaceholderText('Enter name');
      expect(input.props.autoCapitalize).toBe('words');
    });

    it('should handle auto complete', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
          autoComplete="email"
        />
      );

      const input = getByPlaceholderText('Enter email');
      expect(input.props.autoComplete).toBe('email');
    });
  });

  describe('different input types', () => {
    it('should render email input correctly', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Email Address"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter your email"
          icon="mail"
          keyboardType="email-address"
          autoComplete="email"
        />
      );

      const input = getByPlaceholderText('Enter your email');
      expect(input.props.keyboardType).toBe('email-address');
      expect(input.props.autoComplete).toBe('email');
    });

    it('should render password input correctly', () => {
      const { getByPlaceholderText } = render(
        <AuthInput
          label="Password"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter your password"
          secureTextEntry
          icon="lock-closed"
          autoComplete="password"
        />
      );

      const input = getByPlaceholderText('Enter your password');
      expect(input.props.secureTextEntry).toBe(true);
      expect(input.props.autoComplete).toBe('password');
    });
  });

  describe('accessibility', () => {
    it('should be accessible with proper label', () => {
      const { getByText, getByPlaceholderText } = render(
        <AuthInput
          label="Email Address"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter your email"
        />
      );

      expect(getByText('Email Address')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    });

    it('should show error message for accessibility', () => {
      const errorMessage = 'Please enter a valid email';
      const { getByText } = render(
        <AuthInput
          label="Email"
          value=""
          onChangeText={mockOnChangeText}
          placeholder="Enter email"
          error={errorMessage}
        />
      );

      expect(getByText(errorMessage)).toBeTruthy();
    });
  });
}); 