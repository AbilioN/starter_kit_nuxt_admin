export const API_CONFIG = {
  BASE_URL: 'http://localhost:8006/api/admin',
  PUBLIC_BASE_URL: 'http://localhost:8006/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    ME: '/me',
  }
} as const;

export const getApiConfig = () => {
  return {
    baseURL: process.env.NUXT_API_BASE_URL || API_CONFIG.BASE_URL,
    publicBaseURL: process.env.NUXT_PUBLIC_API_BASE_URL || API_CONFIG.PUBLIC_BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  };
}; 