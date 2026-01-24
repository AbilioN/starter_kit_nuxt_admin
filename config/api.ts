export const API_CONFIG = {
  BASE_URL: 'http://localhost:8006/api/admin',
  TIMEOUT: 10000, // 10 segundos
  ENDPOINTS: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    ME: '/me',
  }
} as const;

export const getApiConfig = () => {
  // Em produção, você pode usar variáveis de ambiente
  return {
    baseURL: process.env.NUXT_API_BASE_URL || API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
  };
}; 