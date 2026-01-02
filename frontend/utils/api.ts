import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { triggerLogout } from './logout-helper';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - добавляем JWT токен
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ошибок
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      // 401 Unauthorized - истек токен или не авторизован
      if (status === 401) {
        triggerLogout();
      }

      // 403 Forbidden - нет доступа
      if (status === 403) {
        // Можно показать уведомление или редирект
        console.error('Access forbidden');
      }

      // 500 Internal Server Error
      if (status === 500) {
        console.error('Server error');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

