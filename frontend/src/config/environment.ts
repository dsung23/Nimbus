// Environment Configuration
// This file manages environment-specific variables

export const ENV_CONFIG = {
  // Teller Configuration
  TELLER_APPLICATION_ID: process.env.EXPO_PUBLIC_TELLER_APP_ID || "YOUR_APPLICATION_ID",
  TELLER_ENVIRONMENT: process.env.EXPO_PUBLIC_TELLER_ENV || "sandbox", // "sandbox" or "production"
  
  // API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.12:3789",
  
  // App Configuration
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || "development", // "development", "staging", "production"
} as const;

// Helper function to validate required environment variables
export const validateEnvironment = () => {
  const requiredVars = [
    'TELLER_APPLICATION_ID',
    'API_BASE_URL'
  ];
  
  const missing = requiredVars.filter(varName => {
    const value = ENV_CONFIG[varName as keyof typeof ENV_CONFIG];
    return !value || value === "YOUR_APPLICATION_ID";
  });
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing or invalid environment variables: ${missing.join(', ')}`);
    console.warn('Please check your .env file or environment configuration');
  }
  
  return missing.length === 0;
}; 