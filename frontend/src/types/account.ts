// Account types for the carousel dashboard
export interface Account {
  // Core frontend fields (required for UI)
  id: string;
  type: 'checking' | 'savings' | 'credit' | 'loan' | 'investment';
  name: string;
  balance: number;
  mask: string;
  gradientColors: readonly [string, string];
  
  // Additional backend fields (optional for future features)
  institution?: string;
  available_balance?: number;
  currency?: string;
  sync_status?: string;
  is_active?: boolean;
  last_sync?: string;
  created_at?: string;
}

// Frontend display interface for AccountCard component
export interface AccountCardProps {
  account: Account;
  animatedStyle: any; // Animated style object
}

// Carousel state interface
export interface CarouselState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
}

// Dashboard state interface
export interface DashboardState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
} 