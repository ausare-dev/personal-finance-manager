'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Typography, Space, Drawer } from 'antd';
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
  CloseOutlined,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Используем CSS media query вместо JavaScript для определения мобильного режима
    // Это предотвращает конфликты с Ant Design responsive hooks
    if (typeof window === 'undefined') {
      return;
    }
    
    const mediaQuery = window.matchMedia('(max-width: 991px)');
    
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const mobile = e.matches;
      setIsMobile(prev => {
        if (prev === mobile) {
          return prev;
        }
        return mobile;
      });
      
      if (mobile) {
        setCollapsed(true);
      }
    };
    
    // Проверяем при монтировании
    handleMediaChange(mediaQuery);
    
    // Добавляем слушатель
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange);
      };
    } else {
      // Fallback для старых браузеров
      mediaQuery.addListener(handleMediaChange);
      return () => {
        mediaQuery.removeListener(handleMediaChange);
      };
    }
  }, []);

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

  const handleMenuClickWrapper = ({ key }: { key: string }) => {
    handleMenuClick({ key });
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile ? (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          style={{
            overflow: 'auto',
            height: '100%',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
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
            onClick={handleMenuClickWrapper}
          />
        </Sider>
      ) : (
        <Drawer
          title={
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', padding: '8px 0' }}>
              Finance Manager
            </div>
          }
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          styles={{
            body: { padding: 0, background: '#001529' },
            header: {
              background: '#001529', 
              borderBottom: '1px solid #1f1f1f',
              padding: '16px 24px'
            }
          }}
          size={280}
          closable={true}
          closeIcon={<CloseOutlined style={{ color: '#fff', fontSize: 18 }} />}
          zIndex={1000}
          maskClosable={true}
        >
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={handleMenuClickWrapper}
            style={{ borderRight: 0, background: '#001529' }}
          />
        </Drawer>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 80 : 250),
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
        }}
      >
        <AntHeader
          style={{
            padding: isMobile ? '0 16px' : '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <Button
            type="text"
            icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => {
              if (isMobile) {
                setMobileMenuOpen(true);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            style={{
              fontSize: 18,
              width: isMobile ? 48 : 64,
              height: isMobile ? 48 : 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Toggle menu"
          />

          <Space size={isMobile ? 'small' : 'middle'}>
            {!isMobile && <Text type="secondary">{user?.email}</Text>}
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
                size={isMobile ? 'default' : 'large'}
              >
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </Dropdown>
          </Space>
        </AntHeader>

        <Content
          style={{
            margin: isMobile ? '16px 8px' : '24px 16px',
            padding: isMobile ? 16 : 24,
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

