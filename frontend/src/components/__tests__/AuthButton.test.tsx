import React from 'react';
import { render, fireEvent } from '../../test/utils';
import { AuthButton } from '../AuthButton';

describe('AuthButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render correctly with primary variant', () => {
      const { getByText } = render(
        <AuthButton 
          title="Sign In" 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      expect(getByText('Sign In')).toBeTruthy();
    });

    it('should render correctly with secondary variant', () => {
      const { getByText } = render(
        <AuthButton 
          title="Sign Up" 
          onPress={mockOnPress} 
          variant="secondary" 
        />
      );

      expect(getByText('Sign Up')).toBeTruthy();
    });

    it('should display the correct title text', () => {
      const title = 'Custom Button Title';
      const { getByText } = render(
        <AuthButton 
          title={title} 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      expect(getByText(title)).toBeTruthy();
    });
  });

  describe('interaction', () => {
    it('should call onPress when button is pressed', () => {
      const { getByText } = render(
        <AuthButton 
          title="Press Me" 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      fireEvent.press(getByText('Press Me'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should call onPress multiple times when pressed multiple times', () => {
      const { getByText } = render(
        <AuthButton 
          title="Press Me" 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      const button = getByText('Press Me');
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(3);
    });

    it('should be touchable/pressable', () => {
      const { getByText } = render(
        <AuthButton 
          title="Touchable Button" 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      const button = getByText('Touchable Button');
      expect(button.parent).toBeTruthy(); // Should be wrapped in a touchable component
    });
  });

  describe('variants', () => {
    it('should handle primary variant correctly', () => {
      const { getByText } = render(
        <AuthButton 
          title="Primary Button" 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      // Test that it renders without crashing and displays text
      expect(getByText('Primary Button')).toBeTruthy();
    });

    it('should handle secondary variant correctly', () => {
      const { getByText } = render(
        <AuthButton 
          title="Secondary Button" 
          onPress={mockOnPress} 
          variant="secondary" 
        />
      );

      // Test that it renders without crashing and displays text
      expect(getByText('Secondary Button')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should be accessible with proper text content', () => {
      const title = 'Accessible Button';
      const { getByText } = render(
        <AuthButton 
          title={title} 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      const buttonText = getByText(title);
      expect(buttonText).toBeTruthy();
      expect(buttonText.children[0]).toBe(title);
    });

    it('should support different button titles for accessibility', () => {
      const titles = ['Sign In', 'Sign Up', 'Continue', 'Submit'];
      
      titles.forEach(title => {
        const { getByText } = render(
          <AuthButton 
            title={title} 
            onPress={mockOnPress} 
            variant="primary" 
          />
        );
        
        expect(getByText(title)).toBeTruthy();
      });
    });
  });

  describe('error handling', () => {
    it('should handle undefined onPress gracefully', () => {
      // This should not crash the component
      expect(() => {
        render(
          <AuthButton 
            title="Button" 
            onPress={undefined as any} 
            variant="primary" 
          />
        );
      }).not.toThrow();
    });

    it('should handle empty title gracefully', () => {
      const { container } = render(
        <AuthButton 
          title="" 
          onPress={mockOnPress} 
          variant="primary" 
        />
      );

      // Should render without crashing
      expect(container).toBeTruthy();
    });
  });
}); 