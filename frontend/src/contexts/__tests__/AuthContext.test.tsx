import React from 'react';
import { render, act, renderHook, waitFor } from '../../test/utils';
import { AuthProvider, useAuth } from '../AuthContext';
import { mockUser } from '../../test/utils';

// Test component to test the context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading, signIn, signOut } = useAuth();
  
  return (
    <>
      <text testID="user-status">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </text>
      <text testID="user-data">
        {user ? `${user.firstName} ${user.lastName}` : 'No user'}
      </text>
      <button testID="sign-in-btn" onPress={() => signIn(mockUser)}>
        Sign In
      </button>
      <button testID="sign-out-btn" onPress={() => signOut()}>
        Sign Out
      </button>
    </>
  );
};

describe('AuthContext', () => {
  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.error).toEqual(
        Error('useAuth must be used within an AuthProvider')
      );
    });

    it('should provide auth context when used within AuthProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current).toEqual({
        user: null,
        isAuthenticated: false,
        isLoading: true, // Initially loading
        signIn: expect.any(Function),
        signOut: expect.any(Function),
      });
    });
  });

  describe('AuthProvider', () => {
    it('should render children and provide initial state', async () => {
      const { getByTestId } = render(<TestComponent />);
      
      // Initially loading
      expect(getByTestId('user-status')).toHaveTextContent('loading');
      
      // After loading completes
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('not-authenticated');
      });
      
      expect(getByTestId('user-data')).toHaveTextContent('No user');
    });

    it('should handle sign in flow', async () => {
      const { getByTestId } = render(<TestComponent />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('not-authenticated');
      });
      
      // Sign in
      await act(async () => {
        getByTestId('sign-in-btn').props.onPress();
      });
      
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('authenticated');
        expect(getByTestId('user-data')).toHaveTextContent('John Doe');
      });
    });

    it('should handle sign out flow', async () => {
      const { getByTestId } = render(<TestComponent />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('not-authenticated');
      });
      
      // Sign in first
      await act(async () => {
        getByTestId('sign-in-btn').props.onPress();
      });
      
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('authenticated');
      });
      
      // Sign out
      await act(async () => {
        getByTestId('sign-out-btn').props.onPress();
      });
      
      await waitFor(() => {
        expect(getByTestId('user-status')).toHaveTextContent('not-authenticated');
        expect(getByTestId('user-data')).toHaveTextContent('No user');
      });
    });

    it('should maintain authentication state correctly', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Initially not authenticated
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      
      // Sign in
      await act(async () => {
        await result.current.signIn(mockUser);
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      
      // Sign out
      await act(async () => {
        await result.current.signOut();
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    it('should handle loading state properly', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Initially loading
      expect(result.current.isLoading).toBe(true);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    // Mock console.error to avoid cluttering test output
    const originalConsoleError = console.error;
    beforeEach(() => {
      console.error = jest.fn();
    });
    
    afterEach(() => {
      console.error = originalConsoleError;
    });

    it('should handle sign in errors gracefully', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Test error handling by passing invalid data
      await expect(
        act(async () => {
          await result.current.signIn(null as any);
        })
      ).rejects.toThrow();
      
      // Should remain unauthenticated
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
}); 