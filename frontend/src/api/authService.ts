import { User } from '../types/user';

// Mock user data for development
const mockUser: User = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  fullName: 'John Doe',
  email: 'john.doe@email.com',
  phoneNumber: '+1 (555) 123-4567',
  dateOfBirth: '1990-01-15',
  memberSince: '2022-08-20',
};

// Mock session data
const mockSession = {
  access_token: 'mock_access_token',
  refresh_token: 'mock_refresh_token',
  expires_at: Date.now() + 3600000, // 1 hour from now
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; session: any | null; error: { message: string } | null }> => {
  console.log('Simulating API call to sign in with:', { email });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real app, this would be a call to Supabase Auth.
  // e.g., const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Simulate a successful login for a known user
  if (password === 'password') {
    // On success, Supabase returns a user and session object.
    // The `user` object should conform to the `User` interface defined in the Profile prompt.
    return { user: mockUser, session: mockSession, error: null };
  } else {
    // Simulate a failed login
    return { user: null, session: null, error: { message: 'Invalid credentials.' } };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  userData: {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
  }
): Promise<{ user: User | null; session: any | null; error: { message: string } | null }> => {
  console.log('Simulating API call to sign up with:', { email, ...userData });

  // In a real Supabase call, additional user data is passed in the options object.
  // const { data, error } = await supabase.auth.signUp({
  //   email: email,
  //   password: password,
  //   options: {
  //     data: {
  //       full_name: userData.fullName,
  //       date_of_birth: userData.dateOfBirth,
  //       phone_number: userData.phoneNumber,
  //     }
  //   }
  // });

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate a successful sign-up
  if (email.includes('@')) {
    const newUser: User = {
      id: `new-user-${Date.now()}`,
      fullName: userData.fullName,
      email: email,
      phoneNumber: userData.phoneNumber,
      dateOfBirth: userData.dateOfBirth,
      memberSince: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    };

    return { user: newUser, session: mockSession, error: null };
  } else {
    // Simulate a failure
    return { user: null, session: null, error: { message: 'Invalid email address.' } };
  }
};

export const updateUserPassword = async (
  newPassword: string
): Promise<{ error: { message: string } | null }> => {
  console.log('Simulating API call to update password');

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real app, this would be a call to Supabase Auth.
  // e.g., const { error } = await supabase.auth.updateUser({ password: newPassword });

  // Simulate success
  return { error: null };
}; 