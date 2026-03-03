'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Space,
  Spin,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  App,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { educationService } from '@/services/education.service';
import { useAuth } from '@/contexts/AuthContext';
import type { Article, CreateArticleDto, UpdateArticleDto } from '@/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const { Title } = Typography;
const { TextArea } = Input;

export default function EducationAdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [articlesData, categoriesData] = await Promise.all([
        educationService.getAll(),
        educationService.getCategories(),
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch {
      message.error('Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
  };

  const openCreate = () => {
    setEditingArticle(null);
    setModalOpen(true);
  };

  const openEdit = (article: Article) => {
    setEditingArticle(article);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;
    if (editingArticle) {
      educationService.getById(editingArticle.id).then((full) => {
        const isExistingCategory = categories.includes(full.category);
        form.setFieldsValue({
          title: full.title,
          content: full.content,
          category: isExistingCategory ? full.category : undefined,
          categoryNew: isExistingCategory ? '' : full.category,
          summary: full.summary ?? '',
        });
      });
    } else {
      form.setFieldsValue({
        title: '',
        content: '',
        category: undefined,
        categoryNew: '',
        summary: '',
      });
    }
  }, [modalOpen, editingArticle, categories, form]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingArticle(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const category = values.categoryNew?.trim() || values.category;
      if (!category) {
        message.error('Укажите категорию');
        return;
      }
      setSubmitLoading(true);
      if (editingArticle) {
        const dto: UpdateArticleDto = {
          title: values.title,
          content: values.content,
          category,
          summary: values.summary || undefined,
        };
        await educationService.updateArticle(editingArticle.id, dto);
        message.success('Статья обновлена');
      } else {
        const dto: CreateArticleDto = {
          title: values.title,
          content: values.content,
          category,
          summary: values.summary || undefined,
        };
        await educationService.createArticle(dto);
        message.success('Статья создана');
      }
      closeModal();
      await loadData();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        return;
      }
      message.error(editingArticle ? 'Ошибка при обновлении' : 'Ошибка при создании');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await educationService.deleteArticle(id);
      message.success('Статья удалена');
      await loadData();
    } catch {
      message.error('Не удалось удалить статью');
    }
  };

  if (user && user.role !== 'admin' && !loading) {
    return null;
  }

  const columns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => text,
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 140,
    },
    {
      title: 'Дата',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Просмотры',
      dataIndex: 'readCount',
      key: 'readCount',
      width: 115,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: Article) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
            title="Редактировать"
          />
          <Popconfirm
            title="Удалить статью?"
            description="Это действие нельзя отменить."
            onConfirm={() => handleDelete(record.id)}
            okText="Удалить"
            cancelText="Отмена"
            okButtonProps={{ danger: true }}
            overlayClassName="popconfirm-mobile-large"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              title="Удалить"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Title level={2}>Управление статьями</Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Добавить статью
            </Button>
          </div>

          <Card>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
              </div>
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={articles}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Всего: ${total}` }}
              />
            )}
          </Card>
        </Space>

        <Modal
          title={editingArticle ? 'Редактировать статью' : 'Добавить статью'}
          open={modalOpen}
          onCancel={closeModal}
          onOk={handleSubmit}
          confirmLoading={submitLoading}
          width={640}
          destroyOnHidden
          okText={editingArticle ? 'Сохранить' : 'Создать'}
        >
          <Form form={form} layout="vertical" preserve={false}>
            <Form.Item
              name="title"
              label="Название"
              rules={[{ required: true, message: 'Введите название' }]}
            >
              <Input placeholder="Название статьи" />
            </Form.Item>
            <Form.Item label="Категория" required>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="category" noStyle>
                  <Select
                    placeholder="Выберите категорию"
                    allowClear
                    style={{ width: 220 }}
                    options={categories.map((c) => ({ label: c, value: c }))}
                  />
                </Form.Item>
                <Form.Item name="categoryNew" noStyle>
                  <Input placeholder="или введите новую" style={{ flex: 1 }} />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
            <Form.Item
              name="content"
              label="Содержимое (Markdown)"
              rules={[{ required: true, message: 'Введите содержимое' }]}
            >
              <TextArea rows={10} placeholder="Текст статьи в формате Markdown" />
            </Form.Item>
            <Form.Item name="summary" label="Краткое описание (необязательно)">
              <TextArea rows={2} placeholder="Краткое описание" />
            </Form.Item>
          </Form>
        </Modal>
      </MainLayout>
    </ProtectedRoute>
  );
}
