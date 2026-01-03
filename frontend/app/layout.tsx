import type { Metadata } from "next";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App as AntdApp } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../contexts/AppContext';
import { FixResponsiveObserver } from './fix-responsive-observer';
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Finance Manager",
  description: "Управление личными финансами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <FixResponsiveObserver />
          <ConfigProvider
            locale={ruRU}
            theme={{
              token: {
                colorPrimary: '#1890ff',
                borderRadius: 6,
              },
            }}
            componentSize="large"
            button={{
              autoInsertSpace: false,
            }}
          >
            <AntdApp>
              <AppProvider>
                <AuthProvider>
                  {children}
                </AuthProvider>
              </AppProvider>
            </AntdApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
