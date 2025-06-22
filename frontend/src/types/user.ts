export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  profileImageUrl?: string;
  memberSince: string; // YYYY-MM-DD
} 