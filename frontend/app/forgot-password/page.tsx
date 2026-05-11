'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Form, Input, Button, Card, Typography, App, Result } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { authService } from '@/services/auth.service';

const { Title, Text } = Typography;

const schema = yup.object({
  email: yup
    .string()
    .required('Email обязателен для заполнения')
    .email('Введите корректный email'),
});

interface FormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await authService.forgotPassword({ email: data.email });
      setSent(true);
    } catch {
      message.error('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            maxWidth: 450,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Result
            status="success"
            title="Письмо отправлено"
            subTitle="Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля. Проверьте почту."
            extra={
              <Link href="/login">
                <Button type="primary">Вернуться ко входу</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
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
          <Title level={2}>Забыли пароль?</Title>
          <Text type="secondary">
            Введите email, и мы отправим ссылку для сброса пароля
          </Text>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Form.Item
            label="Email"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
            style={{ marginBottom: 24 }}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="Введите ваш email"
              {...register('email')}
              onChange={(e) => setValue('email', e.target.value)}
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
              Отправить ссылку
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#1890ff' }}>
              Вернуться ко входу
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
