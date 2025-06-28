// Types for Teller API Integration

/**
 * The main enrollment object returned by Teller Connect on success.
 */
export interface TellerConnectEnrollment {
  accessToken: string;
  user: {
    id: string;
  };
  enrollment: {
    id:string;
    institution: {
      name: string;
      id?: string;
    };
  };
  signatures: string[];
}

/**
 * Request body for POST /api/teller/connect
 * This will be sent from our frontend to our backend.
 */
export interface TellerConnectRequest {
  enrollment: TellerConnectEnrollment;
}

/**
 * Response from our backend for POST /api/teller/connect
 */
export interface TellerConnectResponse {
  success: boolean;
  message: string;
  enrollment_id: string;
  sync_results: any; // Define more specific type if needed
}

/**
 * Response from our backend for GET /api/teller/link
 */
export interface TellerConnectLinkResponse {
  success: boolean;
  connect_url: string;
  enrollment_id: string;
  expires_at: string;
}

/**
 * Response from our backend for GET /api/teller/accounts
 */
export interface TellerAccountsResponse {
  success: boolean;
  accounts: any[]; // Define a specific Account type
  total: number;
}

/**
 * Response from our backend for GET /api/teller/sync-status
 */
export interface TellerSyncStatusResponse {
  success: boolean;
  summary: any; // Define a specific Summary type
  accounts: any[]; // Define a specific Account type
}

/**
 * Response from our backend for GET /api/teller/nonce
 */
export interface TellerNonceResponse {
  success: boolean;
  nonce: string;
} 