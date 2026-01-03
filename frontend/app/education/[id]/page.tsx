'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Space,
  Spin,
  Button,
  Tag,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { educationService } from '@/services/education.service';
import type { Article } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const { Title, Text, Paragraph } = Typography;

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const articleId = params?.id as string;

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await educationService.getById(articleId);
      setArticle(data);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: ru });
  };

  const handleBack = () => {
    router.push('/education');
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

  if (!article) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <Card>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Text type="secondary">Статья не найдена</Text>
              <br />
              <Button onClick={handleBack} style={{ marginTop: 16 }}>
                Вернуться к списку
              </Button>
            </div>
          </Card>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            type="link"
          >
            Назад к списку статей
          </Button>

          <Card>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
              {/* Заголовок и метаданные */}
              <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <Tag color="blue" icon={<BookOutlined />}>
                    {article.category}
                  </Tag>
                  <Text type="secondary">
                    <EyeOutlined /> {article.readCount} просмотров
                  </Text>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">{formatDate(article.createdAt)}</Text>
                </Space>
                <Title level={1} style={{ margin: 0 }}>
                  {article.title}
                </Title>
              </Space>

              <Divider />

              {/* Содержимое статьи */}
              <Paragraph
                style={{
                  fontSize: '16px',
                  lineHeight: '1.8',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {article.content}
              </Paragraph>

              <Divider />

              {/* Футер статьи */}
              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                  Вернуться к списку
                </Button>
              </Space>
            </Space>
          </Card>
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}

