'use client';

import { ConfigProvider, theme as antdTheme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useApp } from '../contexts/AppContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme } = useApp();

  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
        components: {
          Layout: {
            bodyBg: theme === 'dark' ? '#141414' : '#f0f2f5',
            headerBg: theme === 'dark' ? '#1f1f1f' : '#fff',
            siderBg: theme === 'dark' ? '#001529' : '#001529',
          },
          Menu: {
            darkItemBg: theme === 'dark' ? '#001529' : '#001529',
            darkSubMenuItemBg: theme === 'dark' ? '#000c17' : '#000c17',
          },
        },
      }}
      componentSize="large"
      button={{
        autoInsertSpace: false,
      }}
    >
      {children}
    </ConfigProvider>
  );
}