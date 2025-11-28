import axios from 'axios';

// Get API URL from environment variable
// In production, VITE_API_URL must be set and must use HTTPS
// In development, it should be set in .env.local
const getApiUrl = (): string => {
  // Try to get from import.meta.env first (build-time injection)
  let apiUrl = import.meta.env.VITE_API_URL;

  // Log for debugging
  console.log('🔍 API URL Resolution:', {
    'import.meta.env.VITE_API_URL': import.meta.env.VITE_API_URL,
    'import.meta.env.MODE': import.meta.env.MODE,
    'import.meta.env.PROD': import.meta.env.PROD,
  });

  // Fallback to default production URL if not set
  if (!apiUrl || apiUrl === 'undefined') {
    const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;
    if (isProduction) {
      console.warn('⚠️ VITE_API_URL not set in build, using production default');
      apiUrl = 'https://api.smokava.com/api';
    } else {
      console.warn('⚠️ VITE_API_URL not set, using development fallback');
      apiUrl = 'http://localhost:5000/api';
    }
  }

  // Ensure API URL ends with /api
  if (!apiUrl.endsWith('/api')) {
    apiUrl = apiUrl.endsWith('/') ? apiUrl + 'api' : apiUrl + '/api';
  }

  // Warn if using HTTP in production
  const isProduction = import.meta.env.MODE === 'production' || import.meta.env.PROD;
  if (isProduction && apiUrl.startsWith('http://')) {
    console.error('❌ ERROR: VITE_API_URL must use HTTPS in production!');
    console.error('   Current value:', apiUrl);
    throw new Error('VITE_API_URL must use HTTPS in production');
  }

  console.log('✅ Using API URL:', apiUrl);
  return apiUrl;
};

const API_URL = getApiUrl();

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
