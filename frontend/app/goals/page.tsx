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
  DatePicker,
  Popconfirm,
  App,
  Tag,
  Row,
  Col,
  Progress,
  Alert,
  Spin,
  Empty,
  Statistic,
  Descriptions,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AimOutlined,
  DollarOutlined,
  CalendarOutlined,
  PercentageOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs, { Dayjs } from 'dayjs';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { goalsService } from '@/services/goals.service';
import type { Goal, CreateGoalDto, UpdateGoalDto } from '@/types';

const { Title, Text } = Typography;

// Схема валидации для формы
const goalSchema = yup.object({
  name: yup.string().required('Название цели обязательно'),
  targetAmount: yup
    .number()
    .required('Целевая сумма обязательна')
    .positive('Целевая сумма должна быть положительной'),
  currentAmount: yup
    .number()
    .min(0, 'Текущая сумма не может быть отрицательной')
    .optional(),
  deadline: yup.string().required('Дедлайн обязателен'),
  interestRate: yup
    .number()
    .min(0, 'Процентная ставка не может быть отрицательной')
    .max(100, 'Процентная ставка не может превышать 100%')
    .optional(),
});

export default function GoalsPage() {
  const { message } = App.useApp();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  type FormData = Omit<CreateGoalDto, 'deadline'> & { deadline: Dayjs | null };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(goalSchema) as any,
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalsService.getAll();
      setGoals(data);
    } catch (error) {
      message.error('Ошибка при загрузке целей');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGoal(null);
    reset();
    setModalVisible(true);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setValue('name', goal.name);
    setValue('targetAmount', parseFloat(goal.targetAmount));
    setValue('currentAmount', parseFloat(goal.currentAmount));
    setValue('deadline', dayjs(goal.deadline));
    setValue('interestRate', parseFloat(goal.interestRate));
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await goalsService.delete(id);
      message.success('Цель удалена');
      loadGoals();
    } catch (error) {
      message.error('Ошибка при удалении цели');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!data.deadline) {
        message.error('Дедлайн обязателен');
        return;
      }

      // Проверка, что текущая сумма не превышает целевую
      if (data.currentAmount && data.currentAmount > data.targetAmount) {
        message.error('Текущая сумма не может превышать целевую сумму');
        return;
      }

      // Проверка, что дедлайн в будущем
      // data.deadline уже проверен на null выше, поэтому можно безопасно работать с ним
      // Преобразуем в Dayjs объект (оборачиваем в dayjs() для гарантии)
      const deadlineDayjs = dayjs(data.deadline);
      const deadlineDate = deadlineDayjs.toDate();
      const now = dayjs().toDate();
      // Добавляем 1 минуту к текущему времени для учета времени выполнения
      const nowPlusMinute = new Date(now.getTime() + 60000);
      if (deadlineDate <= nowPlusMinute) {
        message.error('Дедлайн должен быть в будущем');
        return;
      }

      if (editingGoal) {
        // При обновлении используем UpdateGoalDto (все поля опциональные)
        const updateData: UpdateGoalDto = {
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          deadline: deadlineDayjs.toISOString(),
          interestRate: data.interestRate || 0,
        };
        await goalsService.update(editingGoal.id, updateData);
        message.success('Цель обновлена');
      } else {
        // При создании используем CreateGoalDto
        // deadlineDayjs уже определен выше
        const createData: CreateGoalDto = {
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: data.currentAmount,
          deadline: deadlineDayjs.toISOString(),
          interestRate: data.interestRate || 0,
        };
        await goalsService.create(createData);
        message.success('Цель создана');
      }
      setModalVisible(false);
      setEditingGoal(null);
      reset();
      loadGoals();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при сохранении цели';
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

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy', { locale: ru });
  };

  const getProgressStatus = (
    percentage?: number
  ): 'success' | 'exception' | 'active' | 'normal' => {
    if (!percentage) return 'normal';
    if (percentage >= 100) return 'success';
    if (percentage >= 50) return 'active';
    return 'normal';
  };

  const getProgressColor = (percentage?: number): string => {
    if (!percentage) return '#1890ff';
    if (percentage >= 100) return '#52c41a';
    if (percentage >= 50) return '#1890ff';
    return '#faad14';
  };

  const getDaysRemaining = (deadline: string): number => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isDeadlinePassed = (deadline: string): boolean => {
    return getDaysRemaining(deadline) < 0;
  };

  const isGoalCompleted = (goal: Goal): boolean => {
    return (
      goal.progressPercentage !== undefined && goal.progressPercentage >= 100
    );
  };

  // Расчет прогнозируемой суммы с учетом процентной ставки
  const calculateProjectedAmount = (goal: Goal): number => {
    const current = parseFloat(goal.currentAmount);
    const rate = parseFloat(goal.interestRate || '0');
    const days = goal.daysRemaining || getDaysRemaining(goal.deadline);

    if (days <= 0 || rate === 0) return current;

    // Простой процент: A = P(1 + r*t)
    // где P - текущая сумма, r - годовая ставка, t - доля года
    const years = days / 365;
    const projected = current * (1 + (rate / 100) * years);

    return projected;
  };

  // Статистика
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => isGoalCompleted(g)).length;
  const totalTarget = goals.reduce(
    (sum, g) => sum + parseFloat(g.targetAmount),
    0
  );
  const totalCurrent = goals.reduce(
    (sum, g) => sum + parseFloat(g.currentAmount),
    0
  );
  const averageProgress =
    goals.length > 0
      ? goals.reduce(
          (sum, g) => sum + (g.progressPercentage || 0),
          0
        ) / goals.length
      : 0;

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={24} md={12}>
              <Title level={2} style={{ margin: 0 }}>
                <AimOutlined /> Финансовые цели
              </Title>
            </Col>
            <Col xs={24} sm={24} md={12} style={{ textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={handleCreate}
                block
                className="responsive-button"
              >
                <span className="button-text">
                  <PlusOutlined /> Добавить цель
                </span>
                <span className="button-icon-only">
                  <PlusOutlined />
                </span>
              </Button>
            </Col>
          </Row>

          {/* Статистика */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Всего целей"
                  value={totalGoals}
                  prefix={<AimOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Выполнено"
                  value={completedGoals}
                  styles={{ content: { color: '#52c41a' } }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Общая цель"
                  value={totalTarget}
                  precision={2}
                  suffix="₽"
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Средний прогресс"
                  value={averageProgress}
                  precision={1}
                  suffix="%"
                  styles={{
                    content: {
                      color: averageProgress >= 50 ? '#52c41a' : '#1890ff',
                    },
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Список целей */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : goals.length === 0 ? (
            <Card>
              <Empty description="Нет целей" />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {goals.map((goal) => {
                const progressPercentage = goal.progressPercentage || 0;
                const current = parseFloat(goal.currentAmount);
                const target = parseFloat(goal.targetAmount);
                const remaining = parseFloat(goal.remainingAmount || '0');
                const daysRemaining = goal.daysRemaining || getDaysRemaining(goal.deadline);
                const interestRate = parseFloat(goal.interestRate || '0');
                const projectedAmount = calculateProjectedAmount(goal);
                const isCompleted = isGoalCompleted(goal);
                const isOverdue = isDeadlinePassed(goal.deadline);

                return (
                  <Col xs={24} sm={12} lg={8} key={goal.id}>
                    <Card
                      title={
                        <Space>
                          <span>{goal.name}</span>
                          {isCompleted && (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              Выполнено
                            </Tag>
                          )}
                          {isOverdue && !isCompleted && (
                            <Tag color="error">Просрочено</Tag>
                          )}
                        </Space>
                      }
                      extra={
                        <Space>
                          <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(goal)}
                          >
                            Редактировать
                          </Button>
                          <Popconfirm
                            title="Вы уверены, что хотите удалить эту цель?"
                            onConfirm={() => handleDelete(goal.id)}
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
                      <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                        {/* Progress Bar */}
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 8,
                            }}
                          >
                            <span>
                              Прогресс: {formatAmount(current)} /{' '}
                              {formatAmount(target)}
                            </span>
                            <span style={{ fontWeight: 'bold' }}>
                              {progressPercentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress
                            percent={Math.min(progressPercentage, 100)}
                            status={getProgressStatus(progressPercentage)}
                            strokeColor={getProgressColor(progressPercentage)}
                            showInfo={false}
                          />
                        </div>

                        <Divider style={{ margin: '12px 0' }} />

                        {/* Основная информация */}
                        <Descriptions column={1} size="small">
                          <Descriptions.Item
                            label={
                              <Space>
                                <DollarOutlined />
                                <span>Осталось собрать</span>
                              </Space>
                            }
                          >
                            <Text
                              strong
                              style={{
                                color: remaining >= 0 ? '#52c41a' : '#ff4d4f',
                              }}
                            >
                              {formatAmount(remaining)}
                            </Text>
                          </Descriptions.Item>

                          <Descriptions.Item
                            label={
                              <Space>
                                <CalendarOutlined />
                                <span>Дедлайн</span>
                              </Space>
                            }
                          >
                            <Text
                              style={{
                                color: isOverdue ? '#ff4d4f' : 'inherit',
                              }}
                            >
                              {formatDate(goal.deadline)}
                            </Text>
                            <br />
                            <Text
                              type={daysRemaining < 0 ? 'danger' : 'secondary'}
                              style={{ fontSize: 12 }}
                            >
                              {daysRemaining >= 0
                                ? `Осталось ${daysRemaining} дней`
                                : `Просрочено на ${Math.abs(daysRemaining)} дней`}
                            </Text>
                          </Descriptions.Item>

                          {interestRate > 0 && (
                            <>
                              <Descriptions.Item
                                label={
                                  <Space>
                                    <PercentageOutlined />
                                    <span>Процентная ставка</span>
                                  </Space>
                                }
                              >
                                <Text>{interestRate}% годовых</Text>
                              </Descriptions.Item>

                              <Descriptions.Item
                                label={
                                  <Space>
                                    <ClockCircleOutlined />
                                    <span>Прогноз с учетом %</span>
                                  </Space>
                                }
                              >
                                <Text strong>
                                  {formatAmount(projectedAmount)}
                                </Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Прогнозируемая сумма к дедлайну
                                </Text>
                              </Descriptions.Item>
                            </>
                          )}
                        </Descriptions>

                        {/* Уведомления */}
                        {isOverdue && !isCompleted && (
                          <Alert
                            message="Дедлайн прошел!"
                            description="Цель просрочена. Рекомендуется обновить дедлайн или скорректировать план."
                            type="warning"
                            showIcon
                            style={{ marginTop: 8 }}
                          />
                        )}

                        {isCompleted && (
                          <Alert
                            message="Цель достигнута!"
                            description="Поздравляем! Вы успешно достигли своей финансовой цели."
                            type="success"
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
          title={editingGoal ? 'Редактировать цель' : 'Создать цель'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            reset();
          }}
          footer={null}
          width={600}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Form.Item
              label="Название цели"
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
            >
              <input
                type="text"
                placeholder="Например: Накопить на отпуск"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                }}
                {...register('name')}
              />
            </Form.Item>

            <Form.Item
              label="Целевая сумма (₽)"
              validateStatus={errors.targetAmount ? 'error' : ''}
              help={errors.targetAmount?.message}
            >
              <InputNumber
                placeholder="Введите целевую сумму"
                style={{ width: '100%' }}
                min={0}
                step={1000}
                value={watch('targetAmount')}
                onChange={(value) => setValue('targetAmount', value || 0)}
              />
            </Form.Item>

            <Form.Item
              label="Текущая сумма (₽)"
              validateStatus={errors.currentAmount ? 'error' : ''}
              help={errors.currentAmount?.message}
            >
              <InputNumber
                placeholder="Введите текущую сумму (опционально)"
                style={{ width: '100%' }}
                min={0}
                step={100}
                value={watch('currentAmount')}
                onChange={(value) => setValue('currentAmount', value || 0)}
              />
            </Form.Item>

            <Form.Item
              label="Дедлайн"
              validateStatus={errors.deadline ? 'error' : ''}
              help={errors.deadline?.message}
            >
              <DatePicker
                placeholder="Выберите дату"
                style={{ width: '100%' }}
                value={watch('deadline') as Dayjs | undefined}
                onChange={(date) => setValue('deadline', date)}
                format="DD.MM.YYYY"
                disabledDate={(current) =>
                  current && current < dayjs().startOf('day')
                }
              />
            </Form.Item>

            <Form.Item
              label="Процентная ставка (% годовых)"
              validateStatus={errors.interestRate ? 'error' : ''}
              help={errors.interestRate?.message || 'Опционально. Для расчета прогнозируемой суммы'}
            >
              <InputNumber
                placeholder="Например: 5"
                style={{ width: '100%' }}
                min={0}
                max={100}
                step={0.1}
                value={watch('interestRate')}
                onChange={(value) => setValue('interestRate', value || 0)}
                suffix="%"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingGoal ? 'Сохранить' : 'Создать'}
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

