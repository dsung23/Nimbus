// Validation utility functions

// Email validation function
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation function
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
    };
  }
  
  return { isValid: true };
};

// Name validation function
export const validateName = (name: string): { isValid: boolean; message?: string } => {
  if (name.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  if (name.length > 50) {
    return { isValid: false, message: 'Name cannot exceed 50 characters' };
  }
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  return { isValid: true };
};

// Phone validation function
export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }
  
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return { isValid: false, message: 'Phone number must be at least 10 digits' };
  }
  if (phone.length > 20) {
    return { isValid: false, message: 'Phone number cannot exceed 20 characters' };
  }
  
  return { isValid: true };
};

// Date of birth validation function
export const validateDateOfBirth = (date: string): { isValid: boolean; message?: string } => {
  if (!date) {
    return { isValid: false, message: 'Date of birth is required' };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  
  if (isNaN(selectedDate.getTime())) {
    return { isValid: false, message: 'Please enter a valid date of birth' };
  }
  
  if (selectedDate > today) {
    return { isValid: false, message: 'Date of birth cannot be in the future' };
  }
  
  // Check if user is at least 18 years old
  const age = today.getFullYear() - selectedDate.getFullYear();
  const monthDiff = today.getMonth() - selectedDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
    if (age - 1 < 18) {
      return { isValid: false, message: 'You must be at least 18 years old to register' };
    }
  } else {
    if (age < 18) {
      return { isValid: false, message: 'You must be at least 18 years old to register' };
    }
  }
  
  return { isValid: true };
}; 