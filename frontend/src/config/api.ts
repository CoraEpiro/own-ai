// API configuration for different environments
// Check if we're in development mode
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Base URL for API calls
// In development: use local backend
// In production: use deployed backend URL
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001/api'  // Local backend
  : 'https://own-ai-production.up.railway.app/api'; // Deployed backend

// Configure axios defaults
export const configureAxios = () => {
  return API_BASE_URL;
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
}; 