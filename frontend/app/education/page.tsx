'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Spin,
  Empty,
  Select,
  Input,
  Button,
} from 'antd';
import {
  BookOutlined,
  ReadOutlined,
  SearchOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { educationService } from '@/services/education.service';
import type { Article } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

export default function EducationPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [articles, selectedCategory, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [articlesData, categoriesData] = await Promise.all([
        educationService.getAll(),
        educationService.getCategories(),
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading education data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    // Поиск по названию и содержимому
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query)
      );
    }

    setFilteredArticles(filtered);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: ru });
  };

  const handleArticleClick = (id: string) => {
    router.push(`/education/${id}`);
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>
                <BookOutlined /> Образовательные материалы
              </Title>
            </Col>
          </Row>

          {/* Фильтры и поиск */}
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Space orientation="vertical" style={{ width: '100%' }} size="small">
                  <Text strong>Категория:</Text>
                  <Select
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">Все категории</Option>
                    {categories.map((category) => (
                      <Option key={category} value={category}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={12} md={16}>
                <Space orientation="vertical" style={{ width: '100%' }} size="small">
                  <Text strong>Поиск:</Text>
                  <Search
                    placeholder="Поиск по названию или содержимому..."
                    allowClear
                    enterButton={<SearchOutlined />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={(value) => setSearchQuery(value)}
                  />
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Список статей */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <Card>
              <Empty description="Статьи не найдены" />
            </Card>
          ) : (
            <>
              <Text type="secondary">
                Найдено статей: {filteredArticles.length}
              </Text>
              <Row gutter={[16, 16]}>
                {filteredArticles.map((article) => (
                  <Col xs={24} sm={12} lg={8} key={article.id}>
                    <Card
                      hoverable
                      style={{ height: '100%' }}
                      onClick={() => handleArticleClick(article.id)}
                      actions={[
                        <Space key="read">
                          <ReadOutlined />
                          <span>Читать</span>
                        </Space>,
                      ]}
                    >
                      <Space orientation="vertical" style={{ width: '100%' }} size="small">
                        <Tag color="blue">{article.category}</Tag>
                        <Title level={4} style={{ margin: 0 }}>
                          {article.title}
                        </Title>
                        <Paragraph
                          ellipsis={{ rows: 3, expandable: false }}
                          style={{ margin: 0, color: '#666' }}
                        >
                          {article.content}
                        </Paragraph>
                        <Space separator={<span>•</span>}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            <EyeOutlined /> {article.readCount}
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatDate(article.createdAt)}
                          </Text>
                        </Space>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}

