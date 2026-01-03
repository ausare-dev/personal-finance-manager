'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, Input, Button, Card, Typography, App, Divider } from 'antd';
import { UserOutlined, LockOutlined, ExperimentOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { LoginRequest } from '@/types';

const { Title, Text } = Typography;

// Схема валидации
const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email обязателен для заполнения')
    .email('Введите корректный email'),
  password: yup
    .string()
    .required('Пароль обязателен для заполнения')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
});

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginRequest>({
    resolver: yupResolver(loginSchema),
  });

  // Редирект если уже авторизован
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: LoginRequest) => {
    try {
      setLoading(true);
      await login(data);
      message.success('Вход выполнен успешно!');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при входе. Проверьте данные.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await login({ email: 'demo@example.com', password: 'demo123' });
      message.success('Добро пожаловать в демо-режим!');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при входе в демо-режим.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Показываем загрузку пока проверяем аутентификацию
  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Text>Загрузка...</Text>
      </div>
    );
  }

  // Не показываем форму если уже авторизован (редирект произойдет)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Вход в систему</Title>
          <Text type="secondary">Personal Finance Manager</Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Item
            label="Email"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
            style={{ marginBottom: 20 }}
          >
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="Введите email"
              {...register('email')}
              onChange={(e) => setValue('email', e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Пароль"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Введите пароль"
              {...register('password')}
              onChange={(e) => setValue('password', e.target.value)}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Войти
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Text type="secondary">
              Нет аккаунта?{' '}
              <Link href="/register" style={{ color: '#1890ff' }}>
                Зарегистрироваться
              </Link>
            </Text>
          </div>

          <Divider style={{ margin: '16px 0' }}>или</Divider>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="default"
              size="large"
              block
              icon={<ExperimentOutlined />}
              onClick={handleDemoLogin}
              loading={loading}
              style={{ borderColor: '#52c41a', color: '#52c41a' }}
            >
              Войти в демо-режим
            </Button>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block', textAlign: 'center', marginTop: 8 }}>
              Попробуйте приложение с демо-данными
            </Text>
          </Form.Item>
        </form>
      </Card>
    </div>
  );
}

