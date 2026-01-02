'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  // Состояние загрузки для глобальных операций
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Глобальные настройки
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // Уведомления (можно расширить позже)
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // Загружаем тему из localStorage при инициализации
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      if (savedTheme) {
        setThemeState(savedTheme);
      } else {
        // Определяем тему из системных настроек
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
      }
    }
  }, []);

  // Сохраняем тему в localStorage при изменении
  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      // Применяем тему к документу (если нужно)
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  // Управление состоянием загрузки
  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  // Показать уведомление (базовая реализация, можно расширить с Ant Design notification)
  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    // TODO: Интегрировать с Ant Design notification
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Временная реализация через console, позже можно добавить Ant Design notification
    if (typeof window !== 'undefined') {
      // Можно использовать Ant Design message или notification
      // message[type](message);
    }
  };

  const value: AppContextType = {
    isLoading,
    setLoading,
    theme,
    setTheme,
    showNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook для использования AppContext
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
