'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import type { RegisterRequest } from '@/types';

const { Title, Text } = Typography;

// Схема валидации
const registerSchema = yup.object({
  email: yup
    .string()
    .required('Email обязателен для заполнения')
    .email('Введите корректный email'),
  password: yup
    .string()
    .required('Пароль обязателен для заполнения')
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Пароль должен содержать заглавные и строчные буквы, а также цифры'
    ),
  confirmPassword: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('password')], 'Пароли не совпадают'),
});

interface RegisterFormData extends RegisterRequest {
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
  });

  const password = watch('password');

  // Редирект если уже авторизован
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      message.success('Регистрация выполнена успешно! Вход в систему...');
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при регистрации. Попробуйте снова.';
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
          <Title level={2}>Регистрация</Title>
          <Text type="secondary">Создайте новый аккаунт</Text>
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
              prefix={<MailOutlined />}
              placeholder="Введите email"
              {...register('email')}
              onChange={(e) => setValue('email', e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Пароль"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message}
            style={{ marginBottom: 20 }}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Введите пароль"
              {...register('password')}
              onChange={(e) => setValue('password', e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Подтвердите пароль"
            validateStatus={errors.confirmPassword ? 'error' : ''}
            help={errors.confirmPassword?.message}
            style={{ marginBottom: 24 }}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Подтвердите пароль"
              {...register('confirmPassword')}
              onChange={(e) => setValue('confirmPassword', e.target.value)}
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
              Зарегистрироваться
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Уже есть аккаунт?{' '}
              <Link href="/login" style={{ color: '#1890ff' }}>
                Войти
              </Link>
            </Text>
          </div>
        </form>
      </Card>
    </div>
  );
}

