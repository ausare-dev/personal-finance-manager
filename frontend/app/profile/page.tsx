'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Button,
  Form,
  Input,
  Space,
  App,
  Divider,
  Spin,
  Alert,
} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { profileService } from '@/services/profile.service';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile, UpdateEmailDto, UpdatePasswordDto } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const { Title, Text } = Typography;

// Схемы валидации
const updateEmailSchema = yup.object({
  email: yup
    .string()
    .required('Email обязателен для заполнения')
    .email('Введите корректный email'),
});

const updatePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Текущий пароль обязателен для заполнения'),
  newPassword: yup
    .string()
    .required('Новый пароль обязателен для заполнения')
    .min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: yup
    .string()
    .required('Подтверждение пароля обязательно')
    .oneOf([yup.ref('newPassword')], 'Пароли не совпадают'),
});

export default function ProfilePage() {
  const { message } = App.useApp();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    control: emailControl,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
    setValue: setEmailValue,
    reset: resetEmail,
  } = useForm<UpdateEmailDto>({
    resolver: yupResolver(updateEmailSchema),
  });

  const {
    control: passwordControl,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<UpdatePasswordDto & { confirmPassword: string }>({
    resolver: yupResolver(updatePasswordSchema),
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setEmailValue('email', data.email);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при загрузке профиля';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (data: UpdateEmailDto) => {
    try {
      setEmailLoading(true);
      const updatedProfile = await profileService.updateEmail(data);
      setProfile(updatedProfile);
      refreshUser();
      message.success('Email успешно обновлен!');
      resetEmail();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при обновлении email';
      message.error(errorMessage);
    } finally {
      setEmailLoading(false);
    }
  };

  const onPasswordSubmit = async (data: UpdatePasswordDto & { confirmPassword: string }) => {
    try {
      setPasswordLoading(true);
      await profileService.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      message.success('Пароль успешно изменен!');
      resetPassword();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при изменении пароля';
      message.error(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Title level={2}>Профиль</Title>

          {/* Информация о пользователе */}
          <Card title="Информация о пользователе" icon={<UserOutlined />}>
            {profile && (
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>Email: </Text>
                  <Text>{profile.email}</Text>
                </div>
                <div>
                  <Text strong>Дата регистрации: </Text>
                  <Text>
                    {format(new Date(profile.createdAt), 'dd MMMM yyyy, HH:mm', {
                      locale: ru,
                    })}
                  </Text>
                </div>
                <div>
                  <Text strong>Последнее обновление: </Text>
                  <Text>
                    {format(new Date(profile.updatedAt), 'dd MMMM yyyy, HH:mm', {
                      locale: ru,
                    })}
                  </Text>
                </div>
              </Space>
            )}
          </Card>

          {/* Изменение email */}
          <Card title="Изменить email" icon={<MailOutlined />}>
            <form onSubmit={handleSubmitEmail(onEmailSubmit)}>
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <label htmlFor="email">
                    <Text strong>Новый email</Text>
                  </label>
                  <Controller
                    name="email"
                    control={emailControl}
                    render={({ field }) => (
                      <Input
                        id="email"
                        type="email"
                        prefix={<MailOutlined />}
                        placeholder="Введите новый email"
                        {...field}
                        status={emailErrors.email ? 'error' : ''}
                        size="large"
                      />
                    )}
                  />
                  {emailErrors.email && (
                    <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                      {emailErrors.email.message}
                    </Text>
                  )}
                </div>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={emailLoading}
                  size="large"
                >
                  Сохранить email
                </Button>
              </Space>
            </form>
          </Card>

          {/* Изменение пароля */}
          <Card title="Изменить пароль" icon={<LockOutlined />}>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <Alert
                  title="Для изменения пароля введите текущий пароль и новый пароль"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <div>
                  <label htmlFor="currentPassword">
                    <Text strong>Текущий пароль</Text>
                  </label>
                  <Controller
                    name="currentPassword"
                    control={passwordControl}
                    render={({ field }) => (
                      <Input.Password
                        id="currentPassword"
                        prefix={<LockOutlined />}
                        placeholder="Введите текущий пароль"
                        {...field}
                        status={passwordErrors.currentPassword ? 'error' : ''}
                        size="large"
                      />
                    )}
                  />
                  {passwordErrors.currentPassword && (
                    <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                      {passwordErrors.currentPassword.message}
                    </Text>
                  )}
                </div>
                <div>
                  <label htmlFor="newPassword">
                    <Text strong>Новый пароль</Text>
                  </label>
                  <Controller
                    name="newPassword"
                    control={passwordControl}
                    render={({ field }) => (
                      <Input.Password
                        id="newPassword"
                        prefix={<LockOutlined />}
                        placeholder="Введите новый пароль (минимум 6 символов)"
                        {...field}
                        status={passwordErrors.newPassword ? 'error' : ''}
                        size="large"
                      />
                    )}
                  />
                  {passwordErrors.newPassword && (
                    <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                      {passwordErrors.newPassword.message}
                    </Text>
                  )}
                </div>
                <div>
                  <label htmlFor="confirmPassword">
                    <Text strong>Подтвердите новый пароль</Text>
                  </label>
                  <Controller
                    name="confirmPassword"
                    control={passwordControl}
                    render={({ field }) => (
                      <Input.Password
                        id="confirmPassword"
                        prefix={<LockOutlined />}
                        placeholder="Повторите новый пароль"
                        {...field}
                        status={passwordErrors.confirmPassword ? 'error' : ''}
                        size="large"
                      />
                    )}
                  />
                  {passwordErrors.confirmPassword && (
                    <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                      {passwordErrors.confirmPassword.message}
                    </Text>
                  )}
                </div>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  size="large"
                  danger
                >
                  Изменить пароль
                </Button>
              </Space>
            </form>
          </Card>
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}