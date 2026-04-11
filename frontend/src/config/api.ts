// API configuration for different environments
const isDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const developmentBackendOrigin = `${window.location.protocol}//${window.location.hostname}:3001`;

// In development, keep the backend host aligned with the current frontend hostname
// so local testing works for both localhost and 127.0.0.1 flows.
export const API_BASE_URL = isDevelopment
  ? `${developmentBackendOrigin}/api`
  : 'https://own-ai-production.up.railway.app/api';

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};

export const getWsUrl = (path: string): string => {
  if (isDevelopment) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.hostname}:3001${path}`;
  }
  return `wss://own-ai-production.up.railway.app${path}`;
};
