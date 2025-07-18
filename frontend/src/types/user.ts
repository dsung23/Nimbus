export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string; // YYYY-MM-DD
  is_active?: boolean;
  created_at?: string;
} 