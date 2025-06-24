import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmail, signUpWithEmail, getTokens, clearTokens } from '../authService';
import { mockUser } from '../../test/utils';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to avoid test output clutter
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signInWithEmail', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should sign in successfully with valid credentials', async () => {
      const mockResponse = {
        success: true,
        user: mockUser,
        auth: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await signInWithEmail(email, password);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3789/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');

      expect(result).toEqual({
        user: mockUser,
        error: null,
      });
    });

    it('should handle login failure from backend', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await signInWithEmail(email, password);

      expect(result).toEqual({
        user: null,
        error: { message: 'Invalid credentials' },
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await signInWithEmail(email, password);

      expect(result).toEqual({
        user: null,
        error: { message: 'A network error occurred.' },
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle missing error message from backend', async () => {
      const mockResponse = {
        success: false,
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await signInWithEmail(email, password);

      expect(result).toEqual({
        user: null,
        error: { message: 'Login failed.' },
      });
    });

    it('should handle invalid access token', async () => {
      const mockResponse = {
        success: true,
        user: mockUser,
        auth: {
          access_token: null, // Invalid token
          refresh_token: 'mock-refresh-token',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Mock AsyncStorage.setItem to spy on calls
      const setItemSpy = AsyncStorage.setItem as jest.Mock;

      const result = await signInWithEmail(email, password);

      // Should not store invalid access token
      expect(setItemSpy).not.toHaveBeenCalledWith('accessToken', null);
      
      expect(result).toEqual({
        user: mockUser,
        error: null,
      });
    });
  });

  describe('signUpWithEmail', () => {
    const email = 'newuser@example.com';
    const password = 'password123';
    const userData = {
      first_name: 'John',
      last_name: 'Doe',
      phone: '+1234567890',
      date_of_birth: '1990-01-01',
    };

    it('should sign up successfully with valid data', async () => {
      const mockResponse = {
        success: true,
        user: mockUser,
        auth: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await signUpWithEmail(email, password, userData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3789/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone: userData.phone,
          date_of_birth: userData.date_of_birth,
        }),
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith('accessToken', 'mock-access-token');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refreshToken', 'mock-refresh-token');

      expect(result).toEqual({
        user: mockUser,
        error: null,
      });
    });

    it('should handle registration failure from backend', async () => {
      const mockResponse = {
        success: false,
        message: 'Email already exists',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const result = await signUpWithEmail(email, password, userData);

      expect(result).toEqual({
        user: null,
        error: { message: 'Email already exists' },
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle network errors during registration', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await signUpWithEmail(email, password, userData);

      expect(result).toEqual({
        user: null,
        error: { message: 'A network error occurred.' },
      });

      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getTokens', () => {
    it('should retrieve tokens from storage successfully', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(mockAccessToken)
        .mockResolvedValueOnce(mockRefreshToken);

      const result = await getTokens();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('refreshToken');

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await getTokens();

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });

      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch tokens from storage',
        expect.any(Error)
      );
    });

    it('should handle missing tokens', async () => {
      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const result = await getTokens();

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });
    });
  });

  describe('clearTokens', () => {
    it('should clear tokens from storage successfully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await clearTokens();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should handle storage errors when clearing tokens', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await clearTokens();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to clear tokens from storage',
        expect.any(Error)
      );
    });
  });
}); 