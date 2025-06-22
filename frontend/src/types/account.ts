// Account types for the carousel dashboard
export interface Account {
  id: string;
  type: 'Savings' | 'Checking' | 'Credit';
  name: string;
  balance: number;
  lastFourDigits: string;
  gradientColors: readonly [string, string];
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