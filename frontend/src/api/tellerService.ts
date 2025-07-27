import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/api';
import {
  TellerConnectRequest,
  TellerConnectResponse,
  TellerConnectLinkResponse,
  TellerAccountsResponse,
  TellerSyncStatusResponse,
  TellerSuccessPayload,
  TellerNonceResponse,
} from '../types/teller';
import { TransactionResponse } from '../types/transaction';

/**
 * Get authentication headers with access token
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const accessToken = await AsyncStorage.getItem('accessToken');
  if (!accessToken) {
    throw new Error('No access token found. Please log in again.');
  }
  
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Handle API response and extract data
 */
const handleApiResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle different error types
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (response.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    } else if (response.status === 400 && data.error === 'Invalid access token') {
      throw new Error(data.message || 'The bank connection failed. Please try connecting again.');
    } else if (response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
  }
  
  // Note: Backend responses might not always have a top-level 'success' field.
  // The check for response.ok should be the primary indicator.
  if (data.success === false) {
    throw new Error(data.message || 'Request failed');
  }
  
  return data;
};

/**
 * Get a secure nonce from the backend before starting Teller Connect
 * GET /api/teller/nonce
 */
export const getNonce = async (): Promise<TellerNonceResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(API_ENDPOINTS.TELLER.NONCE, {
      method: 'GET',
      headers,
    });
    
    return await handleApiResponse<TellerNonceResponse>(response);
  } catch (error) {
    console.error('Error fetching nonce:', error);
    throw error;
  }
};


/**
 * Get Teller Connect configuration for the authenticated user
 * GET /api/teller/connect-config
 */
export const getConnectConfig = async (): Promise<TellerConnectLinkResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(API_ENDPOINTS.TELLER.CONNECT_CONFIG, {
      method: 'GET',
      headers,
    });
    
    const data = await handleApiResponse<TellerConnectLinkResponse>(response);

    // Client-side guard: Ensure the URL is valid
    const tellerUrlRegex = /^https:\/\/connect\.teller\.io/;
    if (!data.connect_url || !tellerUrlRegex.test(data.connect_url)) {
      throw new Error('Received an invalid or malformed connect URL from the server.');
    }

    return data;
  } catch (error) {
    console.error('Error getting Teller Connect configuration:', error);
    throw error;
  }
};

/**
 * Send the successful enrollment object to the backend
 * POST /api/teller/connect
 */
export const connectAccount = async (
  payload: TellerSuccessPayload,
  nonce: string | null
): Promise<TellerConnectResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const requestData: TellerConnectRequest = {
      enrollment: payload,
      nonce: nonce || undefined,
    };
    
    const response = await fetch(API_ENDPOINTS.TELLER.CONNECT, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });
    
    return await handleApiResponse<TellerConnectResponse>(response);
  } catch (error) {
    console.error('Error connecting Teller account:', error);
    throw error;
  }
};

/**
 * Get all connected accounts for the authenticated user
 * GET /api/teller/accounts
 */
export const getAccounts = async (): Promise<TellerAccountsResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(API_ENDPOINTS.TELLER.ACCOUNTS, {
      method: 'GET',
      headers,
    });
    
    return await handleApiResponse<TellerAccountsResponse>(response);
  } catch (error) {
    console.error('Error fetching Teller accounts:', error);
    throw error;
  }
};

/**
 * Get sync status for all user accounts
 * GET /api/teller/sync-status
 */
export const getSyncStatus = async (): Promise<TellerSyncStatusResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(API_ENDPOINTS.TELLER.SYNC_STATUS, {
      method: 'GET',
      headers,
    });
    
    return await handleApiResponse<TellerSyncStatusResponse>(response);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    throw error;
  }
};

/**
 * Manually sync a specific account
 * POST /api/teller/accounts/:accountId/sync
 */
export const syncAccount = async (accountId: string): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(
      `${API_ENDPOINTS.TELLER.ACCOUNTS}/${accountId}/sync`,
      {
        method: 'POST',
        headers,
      }
    );
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`Error syncing account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Disconnect an account (remove from Teller)
 * DELETE /api/teller/accounts/:accountId
 */
export const disconnectAccount = async (accountId: string): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(
      `${API_ENDPOINTS.TELLER.ACCOUNTS}/${accountId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`Error disconnecting account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Get transactions for a specific account
 * GET /api/teller/accounts/:accountId/transactions
 */
export const getTransactions = async (
  accountId: string,
  options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<TransactionResponse> => {
  try {
    const headers = await getAuthHeaders();
    
    // Build query parameters
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    
    const url = `${API_ENDPOINTS.TELLER.ACCOUNTS}/${accountId}/transactions${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    return await handleApiResponse<TransactionResponse>(response);
  } catch (error) {
    console.error(`Error fetching transactions for account ${accountId}:`, error);
    throw error;
  }
};

/**
 * Get account balance for a specific account
 * GET /api/teller/accounts/:accountId/balance
 */
export const getAccountBalance = async (accountId: string): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(
      `${API_ENDPOINTS.TELLER.ACCOUNTS}/${accountId}/balance`,
      {
        method: 'GET',
        headers,
      }
    );
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`Error fetching balance for account ${accountId}:`, error);
    throw error;
  }
};