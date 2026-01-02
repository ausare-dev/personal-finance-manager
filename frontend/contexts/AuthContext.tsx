'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { setLogoutCallback } from '../utils/logout-helper';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем пользователя из localStorage при инициализации
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = authService.getUser();
        const token = authService.getToken();
        
        if (savedUser && token) {
          setUser(savedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Регистрируем callback для автоматического logout при 401
    setLogoutCallback(() => {
      setUser(null);
    });

    // Cleanup
    return () => {
      setLogoutCallback(() => {});
    };
  }, []);

  // Обновить информацию о пользователе
  const refreshUser = () => {
    const savedUser = authService.getUser();
    setUser(savedUser);
  };

  // Вход в систему
  const login = async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await authService.login(data);
      setUser(response.user);
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  // Регистрация
  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await authService.register(data);
      // После регистрации автоматически входим
      await authService.login(data);
      setUser(response.user);
      return response;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  // Выход из системы
  const logout = () => {
    authService.logout();
    setUser(null);
    // Редирект на страницу входа (будет реализовано в компонентах)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook для использования AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
