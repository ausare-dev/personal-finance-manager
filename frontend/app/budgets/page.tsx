'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Button,
  Space,
  Modal,
  Form,
  InputNumber,
  Select,
  Popconfirm,
  message,
  Tag,
  Row,
  Col,
  Progress,
  Alert,
  Spin,
  Empty,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PieChartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { budgetsService } from '@/services/budgets.service';
import type { Budget, CreateBudgetDto, BudgetPeriod } from '@/types';

const { Title } = Typography;
const { Option } = Select;

// Схема валидации для формы
const budgetSchema = yup.object({
  category: yup.string().required('Категория обязательна'),
  limit: yup.number().required('Лимит обязателен').positive('Лимит должен быть положительным'),
  period: yup.string().oneOf(['daily', 'weekly', 'monthly', 'yearly']).required('Период обязателен'),
});

// Популярные категории
const CATEGORIES = [
  'Продукты',
  'Транспорт',
  'Развлечения',
  'Здоровье',
  'Одежда',
  'Образование',
  'Коммунальные услуги',
  'Рестораны',
  'Прочее',
];

// Периоды бюджета
const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'daily', label: 'День' },
  { value: 'weekly', label: 'Неделя' },
  { value: 'monthly', label: 'Месяц' },
  { value: 'yearly', label: 'Год' },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<CreateBudgetDto>({
    resolver: yupResolver(budgetSchema) as any,
  });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetsService.getAll();
      setBudgets(data);
      
      // Проверяем бюджеты на превышение лимитов и показываем уведомления
      checkBudgetLimits(data);
    } catch (error) {
      message.error('Ошибка при загрузке бюджетов');
    } finally {
      setLoading(false);
    }
  };

  const checkBudgetLimits = (budgetsList: Budget[]) => {
    const exceededBudgets = budgetsList.filter(
      (budget) => budget.usagePercentage && budget.usagePercentage >= 100
    );
    
    if (exceededBudgets.length > 0) {
      exceededBudgets.forEach((budget) => {
        message.warning(
          `Бюджет "${budget.category}" превышен на ${(budget.usagePercentage || 0 - 100).toFixed(1)}%`,
          5
        );
      });
    }
  };

  const handleCreate = () => {
    setEditingBudget(null);
    reset();
    setModalVisible(true);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setValue('category', budget.category);
    setValue('limit', parseFloat(budget.limit));
    setValue('period', budget.period);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await budgetsService.delete(id);
      message.success('Бюджет удален');
      loadBudgets();
    } catch (error) {
      message.error('Ошибка при удалении бюджета');
    }
  };

  const onSubmit = async (data: CreateBudgetDto) => {
    try {
      if (editingBudget) {
        await budgetsService.update(editingBudget.id, data);
        message.success('Бюджет обновлен');
      } else {
        await budgetsService.create(data);
        message.success('Бюджет создан');
      }
      setModalVisible(false);
      reset();
      loadBudgets();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при сохранении бюджета';
      message.error(errorMessage);
    }
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const getProgressStatus = (percentage?: number): 'success' | 'exception' | 'active' | 'normal' => {
    if (!percentage) return 'normal';
    if (percentage >= 100) return 'exception';
    if (percentage >= 80) return 'active';
    return 'success';
  };

  const getProgressColor = (percentage?: number): string => {
    if (!percentage) return '#1890ff';
    if (percentage >= 100) return '#ff4d4f';
    if (percentage >= 80) return '#faad14';
    return '#52c41a';
  };

  const getPeriodLabel = (period: BudgetPeriod): string => {
    const periodObj = PERIODS.find((p) => p.value === period);
    return periodObj?.label || period;
  };

  // Статистика
  const totalBudgets = budgets.length;
  const exceededBudgets = budgets.filter(
    (b) => b.usagePercentage && b.usagePercentage >= 100
  ).length;
  const totalLimit = budgets.reduce((sum, b) => sum + parseFloat(b.limit), 0);
  const totalUsed = budgets.reduce((sum, b) => sum + parseFloat(b.used || '0'), 0);

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>
                <PieChartOutlined /> Бюджеты
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Добавить бюджет
              </Button>
            </Col>
          </Row>

          {/* Уведомления о превышении лимитов */}
          {exceededBudgets > 0 && (
            <Alert
              message={`Превышено бюджетов: ${exceededBudgets}`}
              description="Один или несколько бюджетов превысили установленный лимит. Рекомендуется пересмотреть расходы."
              type="warning"
              icon={<WarningOutlined />}
              showIcon
              closable
            />
          )}

          {/* Статистика */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Всего бюджетов"
                  value={totalBudgets}
                  prefix={<PieChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Превышено"
                  value={exceededBudgets}
                  valueStyle={{ color: exceededBudgets > 0 ? '#ff4d4f' : '#52c41a' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Общий лимит"
                  value={totalLimit}
                  precision={2}
                  suffix="₽"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Использовано"
                  value={totalUsed}
                  precision={2}
                  valueStyle={{
                    color: totalUsed > totalLimit ? '#ff4d4f' : '#52c41a',
                  }}
                  suffix="₽"
                />
              </Card>
            </Col>
          </Row>

          {/* Список бюджетов */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : budgets.length === 0 ? (
            <Card>
              <Empty description="Нет бюджетов" />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {budgets.map((budget) => {
                const usagePercentage = budget.usagePercentage || 0;
                const used = parseFloat(budget.used || '0');
                const limit = parseFloat(budget.limit);
                const remaining = parseFloat(budget.remaining || '0');
                const isExceeded = usagePercentage >= 100;

                return (
                  <Col xs={24} sm={12} lg={8} key={budget.id}>
                    <Card
                      title={
                        <Space>
                          <span>{budget.category}</span>
                          <Tag>{getPeriodLabel(budget.period)}</Tag>
                        </Space>
                      }
                      extra={
                        <Space>
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(budget)}
                          >
                            Редактировать
                          </Button>
                          <Popconfirm
                            title="Вы уверены, что хотите удалить этот бюджет?"
                            onConfirm={() => handleDelete(budget.id)}
                            okText="Да"
                            cancelText="Нет"
                          >
                            <Button
                              type="link"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              Удалить
                            </Button>
                          </Popconfirm>
                        </Space>
                      }
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {/* Progress Bar */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 8,
                            }}
                          >
                            <span>Использовано: {formatAmount(used)}</span>
                            <span style={{ fontWeight: 'bold' }}>
                              {usagePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            percent={Math.min(usagePercentage, 100)}
                            status={getProgressStatus(usagePercentage)}
                            strokeColor={getProgressColor(usagePercentage)}
                            showInfo={false}
                          />
                        </div>

                        {/* Статистика */}
                        <Row gutter={[8, 8]}>
                          <Col span={12}>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              Лимит:
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 'bold' }}>
                              {formatAmount(limit)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              Осталось:
                            </div>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: remaining >= 0 ? '#52c41a' : '#ff4d4f',
                              }}
                            >
                              {formatAmount(remaining)}
                            </div>
                          </Col>
                        </Row>

                        {/* Предупреждение о превышении */}
                        {isExceeded && (
                          <Alert
                            message="Лимит превышен!"
                            description={`Превышение: ${formatAmount(Math.abs(remaining))}`}
                            type="error"
                            showIcon
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </Space>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Space>

        {/* Модальное окно для создания/редактирования */}
        <Modal
          title={editingBudget ? 'Редактировать бюджет' : 'Создать бюджет'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            reset();
          }}
          footer={null}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Form.Item
              label="Категория"
              validateStatus={errors.category ? 'error' : ''}
              help={errors.category?.message}
            >
              <Select
                placeholder="Выберите категорию"
                value={watch('category')}
                onChange={(value) => setValue('category', value)}
                style={{ width: '100%' }}
                showSearch
              >
                {CATEGORIES.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Лимит (₽)"
              validateStatus={errors.limit ? 'error' : ''}
              help={errors.limit?.message}
            >
              <InputNumber
                placeholder="Введите лимит"
                style={{ width: '100%' }}
                min={0}
                step={100}
                value={watch('limit')}
                onChange={(value) => setValue('limit', value || 0)}
              />
            </Form.Item>

            <Form.Item
              label="Период"
              validateStatus={errors.period ? 'error' : ''}
              help={errors.period?.message}
            >
              <Select
                placeholder="Выберите период"
                value={watch('period')}
                onChange={(value) => setValue('period', value)}
                style={{ width: '100%' }}
              >
                {PERIODS.map((period) => (
                  <Option key={period.value} value={period.value}>
                    {period.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingBudget ? 'Сохранить' : 'Создать'}
                </Button>
                <Button onClick={() => setModalVisible(false)}>Отмена</Button>
              </Space>
            </Form.Item>
          </form>
        </Modal>
      </MainLayout>
    </ProtectedRoute>
  );
}

