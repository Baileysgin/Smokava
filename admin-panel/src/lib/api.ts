import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests (but not for login endpoint)
api.interceptors.request.use((config) => {
  // Don't add token for login endpoint
  if (config.url?.includes('/admin/login')) {
    console.log('🔓 Login request - skipping token');
    return config;
  }

  // Check for operator token first, then admin token
  const operatorToken = localStorage.getItem('operatorToken');
  const adminToken = localStorage.getItem('adminToken');
  const token = operatorToken || adminToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔑 Adding token to request:', config.url, 'Token length:', token.length);
  } else {
    console.warn('⚠️ No token found in localStorage for request:', config.url);
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('operatorToken');
      // Check if we're on operator routes
      if (window.location.pathname.startsWith('/operator')) {
        window.location.href = '/operator/login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
