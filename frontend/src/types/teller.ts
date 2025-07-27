// Types for Teller Connect flow

/**
 * The raw success payload received from the Teller Connect `onSuccess` callback.
 */
export interface TellerSuccessPayload {
  accessToken: string;
  user: {
    id: string;
  };
  enrollment: {
    id: string;
    institution: {
      name: string;
      id: string;
    };
  };
  signatures?: string[];
}

/**
 * The request body sent to our backend's /api/teller/connect endpoint.
 * It wraps the Teller payload inside an `enrollment` property.
 */
export interface TellerConnectRequest {
  enrollment: TellerSuccessPayload;
  nonce?: string;
}

/**
 * The expected success response from our backend after connecting an account.
 */
export interface TellerConnectResponse {
  success: boolean;
  message: string;
  enrollment_id: string;
  sync_results: any;
  timestamp: string;
}

/**
 * The response from our backend when creating a Teller Connect link.
 */
export interface TellerConnectLinkResponse {
  success: boolean;
  connect_url: string;
  application_id: string;
}

/**
 * The response from our backend when fetching all connected accounts.
 */
export interface TellerAccountsResponse {
  success: boolean;
  accounts: any[]; // Replace 'any' with a proper Account type
  total: number;
}

/**
 * The response from our backend for sync status.
 */
export interface TellerSyncStatusResponse {
  success: boolean;
  summary: {
    total: number;
    active: number;
    syncing: number;
    failed: number;
    last_sync: string | null;
  };
  accounts: any[]; // Replace 'any' with a proper Account type
}

/**
 * The response from our backend when generating a nonce.
 */
export interface TellerNonceResponse {
  success: true;
  nonce: string;
}

// Re-export transaction types for convenience
export type { Transaction, TransactionResponse } from './transaction'; 