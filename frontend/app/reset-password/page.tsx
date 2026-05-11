'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, Input, Button, Card, Typography, App, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

const { Title, Text } = Typography;

const schema = yup.object({
  newPassword: yup
    .string()
    .required('Пароль обязателен для заполнения')
    .min(6, 'Пароль должен содержать минимум 6 символов')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Пароль должен содержать заглавные и строчные буквы, а также цифры',
    ),
  confirmPassword: yup
    .string()
    .required('Подтвердите пароль')
    .oneOf([yup.ref('newPassword')], 'Пароли не совпадают'),
});

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  if (!token) {
    return (
      <PageWrapper>
        <Card
          style={{
            width: '100%',
            maxWidth: 450,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Result
            status="error"
            title="Недействительная ссылка"
            subTitle="Ссылка для сброса пароля недействительна или повреждена."
            extra={
              <Link href="/forgot-password">
                <Button type="primary">Запросить новую ссылку</Button>
              </Link>
            }
          />
        </Card>
      </PageWrapper>
    );
  }

  if (success) {
    return (
      <PageWrapper>
        <Card
          style={{
            width: '100%',
            maxWidth: 450,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Result
            status="success"
            title="Пароль изменён"
            subTitle="Ваш пароль успешно изменён. Теперь вы можете войти с новым паролем."
            extra={
              <Link href="/login">
                <Button type="primary">Войти</Button>
              </Link>
            }
          />
        </Card>
      </PageWrapper>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await authService.resetPassword({
        token,
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const errorMessage =
        err?.response?.data?.message ?? 'Ошибка при сбросе пароля. Попробуйте запросить новую ссылку.';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Новый пароль</Title>
          <Text type="secondary">Введите новый пароль для вашего аккаунта</Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Item
            label="Новый пароль"
            validateStatus={errors.newPassword ? 'error' : ''}
            help={errors.newPassword?.message}
            style={{ marginBottom: 20 }}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Введите новый пароль"
              {...register('newPassword')}
              onChange={(e) => setValue('newPassword', e.target.value)}
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
              placeholder="Подтвердите новый пароль"
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
              Сбросить пароль
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#1890ff' }}>
              Вернуться ко входу
            </Link>
          </div>
        </form>
      </Card>
    </PageWrapper>
  );
}

function PageWrapper({ children }: { children: React.ReactNode }) {
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
      {children}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <PageWrapper>
          <Text style={{ color: '#fff' }}>Загрузка...</Text>
        </PageWrapper>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
