import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { triggerLogout } from './logout-helper';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        triggerLogout();
      }

      if (status === 403) {
        console.error('Access forbidden');
      }

      if (status === 500) {
        console.error('Server error');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

