import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAccounts } from '../accountService';
import { API_ENDPOINTS } from '../../config/api';

// Mock fetch globally
global.fetch = jest.fn();

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('accountService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('getAccounts', () => {
    it('should successfully fetch accounts with valid token', async () => {
      // Mock AsyncStorage to return a valid token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid-token');

      // Mock successful API response
      const mockAccounts = [
        {
          id: '1',
          type: 'savings',
          name: 'Primary Savings',
          balance: 15420.75,
          mask: '1234',
          gradientColors: ['#667eea', '#764ba2'],
          institution: 'Chase Bank',
          available_balance: 15420.75,
          currency: 'USD',
          sync_status: 'synced',
          verification_status: 'verified',
          is_active: true,
          last_sync: '2024-01-15T10:30:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          type: 'checking',
          name: 'Main Checking',
          balance: 3245.50,
          mask: '5678',
          gradientColors: ['#f093fb', '#f5576c'],
          institution: 'Bank of America',
          available_balance: 3245.50,
          currency: 'USD',
          sync_status: 'synced',
          verification_status: 'verified',
          is_active: true,
          last_sync: '2024-01-15T10:30:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          accounts: mockAccounts,
          total: 2,
        }),
      });

      const result = await getAccounts();

      // Verify AsyncStorage was called
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('accessToken');

      // Verify fetch was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.ACCOUNTS, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
      });

      // Verify successful response
      expect(result).toEqual({
        success: true,
        accounts: mockAccounts,
        total: 2,
      });
    });

    it('should handle missing access token', async () => {
      // Mock AsyncStorage to return null
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getAccounts();

      expect(result).toEqual({
        success: false,
        accounts: [],
        total: 0,
        error: 'No access token found',
      });

      // Verify fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API error response', async () => {
      // Mock AsyncStorage to return a valid token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid-token');

      // Mock API error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          message: 'Internal server error',
        }),
      });

      const result = await getAccounts();

      expect(result).toEqual({
        success: false,
        accounts: [],
        total: 0,
        error: 'Internal server error',
      });
    });

    it('should handle network errors', async () => {
      // Mock AsyncStorage to return a valid token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid-token');

      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await getAccounts();

      expect(result).toEqual({
        success: false,
        accounts: [],
        total: 0,
        error: 'Network error',
      });
    });

    it('should handle empty accounts array', async () => {
      // Mock AsyncStorage to return a valid token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid-token');

      // Mock successful response with empty accounts
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          accounts: [],
          total: 0,
        }),
      });

      const result = await getAccounts();

      expect(result).toEqual({
        success: true,
        accounts: [],
        total: 0,
      });
    });

    it('should handle malformed API response', async () => {
      // Mock AsyncStorage to return a valid token
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('valid-token');

      // Mock response without success field
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accounts: [],
          total: 0,
        }),
      });

      const result = await getAccounts();

      expect(result).toEqual({
        success: false,
        accounts: [],
        total: 0,
        error: 'Failed to fetch accounts',
      });
    });
  });
}); 