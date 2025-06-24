export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string; // YYYY-MM-DD
  profileImageUrl?: string;
  memberSince: string; // YYYY-MM-DD
} 