'use client';

import { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  WalletOutlined,
  TransactionOutlined,
  PieChartOutlined,
  TrophyOutlined,
  LineChartOutlined,
  DollarOutlined,
  FileTextOutlined,
  BookOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { MenuProps } from 'antd';

const { Header: AntHeader, Sider, Content } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Меню навигации
  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Главная',
    },
    {
      key: '/wallets',
      icon: <WalletOutlined />,
      label: 'Кошельки',
    },
    {
      key: '/transactions',
      icon: <TransactionOutlined />,
      label: 'Транзакции',
    },
    {
      key: '/budgets',
      icon: <PieChartOutlined />,
      label: 'Бюджеты',
    },
    {
      key: '/goals',
      icon: <TrophyOutlined />,
      label: 'Цели',
    },
    {
      key: '/investments',
      icon: <LineChartOutlined />,
      label: 'Инвестиции',
    },
    {
      key: '/analytics',
      icon: <DollarOutlined />,
      label: 'Аналитика',
    },
    {
      key: '/import-export',
      icon: <FileTextOutlined />,
      label: 'Импорт/Экспорт',
    },
    {
      key: '/education',
      icon: <BookOutlined />,
      label: 'Обучение',
    },
  ];

  // Обработчик выбора пункта меню
  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  // Меню пользователя в Header
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль',
      disabled: true, // Будет реализовано позже
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
      >
        <div
          style={{
            height: 64,
            margin: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'PFM' : 'Finance Manager'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: 'margin-left 0.2s',
        }}
      >
        <AntHeader
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: 16,
              width: 64,
              height: 64,
            }}
          />

          <Space>
            <Text type="secondary">{user?.email}</Text>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Avatar
                style={{
                  backgroundColor: '#1890ff',
                  cursor: 'pointer',
                }}
                icon={<UserOutlined />}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </Dropdown>
          </Space>
        </AntHeader>

        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
          }}
        >
          <div style={{ maxWidth: '100%', overflowX: 'auto' }}>{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
}

