import axios from 'axios';

// Get API URL from environment variable
// In production, NEXT_PUBLIC_API_URL must be set and must use HTTPS
// In development, it should be set in .env.local
const getApiUrl = (): string => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
    // Warn if using HTTP in production
    if (process.env.NODE_ENV === 'production' && apiUrl.startsWith('http://')) {
      console.error('❌ ERROR: NEXT_PUBLIC_API_URL must use HTTPS in production!');
      console.error('   Current value:', apiUrl);
      throw new Error('NEXT_PUBLIC_API_URL must use HTTPS in production');
    }
    return apiUrl;
  }

  // No localhost fallback - environment variable is required
  console.error('❌ NEXT_PUBLIC_API_URL environment variable is required');
  throw new Error('NEXT_PUBLIC_API_URL environment variable must be set. No localhost fallback allowed.');
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout for all requests
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Improve error handling for network/timeout errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      error.message = 'درخواست شما زمان زیادی طول کشید. لطفا دوباره تلاش کنید.';
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      error.message = 'خطا در اتصال به سرور. لطفا اتصال اینترنت خود را بررسی کنید.';
    }
    return Promise.reject(error);
  }
);

export default api;
