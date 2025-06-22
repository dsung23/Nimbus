import { User } from '../types/user';

// This is a placeholder for the actual user data that would be returned from the API
let currentUserData: User = {
  id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  fullName: 'John Doe',
  email: 'john.doe@email.com',
  phoneNumber: '+1 (555) 123-4567',
  dateOfBirth: '1990-01-15',
  memberSince: '2022-08-20',
};

export const updateUserProfile = async (
  updates: Partial<User>
): Promise<{ success: boolean; data: User }> => {
  console.log('Simulating API call to update user profile with:', updates);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // In a real app, this would be a fetch/axios call.
  // For now, we'll merge the updates into our mock data.
  currentUserData = { ...currentUserData, ...updates };

  return { success: true, data: currentUserData };
}; 