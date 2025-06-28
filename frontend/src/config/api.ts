export const API_CONFIG = {
  //localhost:3789
  BASE_URL: 'http://192.168.1.129:3789',
  AUTH_ENDPOINT: '/api/auth',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_ENDPOINT}/login`,
    REGISTER: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_ENDPOINT}/register`,
    PROFILE: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_ENDPOINT}/profile`,
    CHANGE_PASSWORD: `${API_CONFIG.BASE_URL}${API_CONFIG.AUTH_ENDPOINT}/change-password`,
  },
} as const; 