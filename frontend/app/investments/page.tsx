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
  Input,
  Popconfirm,
  App,
  Tag,
  Row,
  Col,
  Table,
  Spin,
  Empty,
  Statistic,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs, { Dayjs } from 'dayjs';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { investmentsService, type PortfolioSummary } from '@/services/investments.service';
import type { Investment, CreateInvestmentDto } from '@/types';

const { Title } = Typography;

// Схема валидации для формы
const investmentSchema = yup.object({
  assetName: yup.string().required('Название актива обязательно'),
  quantity: yup
    .number()
    .required('Количество обязательно')
    .positive('Количество должно быть положительным'),
  purchasePrice: yup
    .number()
    .required('Цена покупки обязательна')
    .positive('Цена покупки должна быть положительной'),
  currentPrice: yup
    .number()
    .required('Текущая цена обязательна')
    .positive('Текущая цена должна быть положительной'),
  purchaseDate: yup.string().required('Дата покупки обязательна'),
});

// Цвета для графиков
const COLORS = [
  '#1890ff',
  '#52c41a',
  '#faad14',
  '#f5222d',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#fa8c16',
];

export default function InvestmentsPage() {
  const { message } = App.useApp();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  type FormData = Omit<CreateInvestmentDto, 'purchaseDate'> & { purchaseDate: Dayjs | null };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(investmentSchema) as any,
  });

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      const [investmentsData, portfolioData] = await Promise.all([
        investmentsService.getAll(),
        investmentsService.getPortfolio(),
      ]);
      setInvestments(investmentsData);
      setPortfolio(portfolioData);
    } catch (error) {
      message.error('Ошибка при загрузке инвестиций');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingInvestment(null);
    reset();
    setModalVisible(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setValue('assetName', investment.assetName);
    setValue('quantity', parseFloat(investment.quantity));
    setValue('purchasePrice', parseFloat(investment.purchasePrice));
    setValue('currentPrice', parseFloat(investment.currentPrice));
    setValue('purchaseDate', dayjs(investment.purchaseDate));
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await investmentsService.delete(id);
      message.success('Инвестиция удалена');
      loadInvestments();
    } catch (error) {
      message.error('Ошибка при удалении инвестиции');
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (!data.purchaseDate) {
        message.error('Дата покупки обязательна');
        return;
      }

      const submitData: CreateInvestmentDto = {
        assetName: data.assetName,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        currentPrice: data.currentPrice,
        purchaseDate: data.purchaseDate.toISOString(),
      };

      if (editingInvestment) {
        await investmentsService.update(editingInvestment.id, submitData);
        message.success('Инвестиция обновлена');
      } else {
        await investmentsService.create(submitData);
        message.success('Инвестиция создана');
      }
      setModalVisible(false);
      reset();
      loadInvestments();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при сохранении инвестиции';
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
    return format(new Date(date), 'dd.MM.yyyy', { locale: ru });
  };

  // Подготовка данных для круговой диаграммы портфеля
  const portfolioPieData = portfolio?.investments.map((inv, index) => ({
    name: inv.assetName,
    value: parseFloat(inv.totalValue || '0'),
    profitLoss: parseFloat(inv.profitLoss || '0'),
    profitLossPercentage: inv.profitLossPercentage || 0,
  })) || [];

  // Подготовка данных для столбчатой диаграммы прибыли/убытка
  const profitLossBarData = investments.map((inv) => ({
    name: inv.assetName,
    profitLoss: parseFloat(inv.profitLoss || '0'),
    profitLossPercentage: inv.profitLossPercentage || 0,
  }));

  // Колонки таблицы
  const columns = [
    {
      title: 'Актив',
      dataIndex: 'assetName',
      key: 'assetName',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value: string) => parseFloat(value).toFixed(2),
    },
    {
      title: 'Цена покупки',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      render: (value: string) => formatAmount(value),
    },
    {
      title: 'Текущая цена',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (value: string) => formatAmount(value),
    },
    {
      title: 'Дата покупки',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Стоимость покупки',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (value: string | undefined) =>
        value ? formatAmount(value) : '-',
    },
    {
      title: 'Текущая стоимость',
      dataIndex: 'totalValue',
      key: 'totalValue',
      render: (value: string | undefined) =>
        value ? formatAmount(value) : '-',
    },
    {
      title: 'Прибыль/Убыток',
      key: 'profitLoss',
      render: (_: any, record: Investment) => {
        const profitLoss = parseFloat(record.profitLoss || '0');
        const percentage = record.profitLossPercentage || 0;
        const isProfit = profitLoss >= 0;

        return (
          <Space orientation="vertical" size={0}>
            <Tag
              color={isProfit ? 'success' : 'error'}
              icon={isProfit ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            >
              {formatAmount(Math.abs(profitLoss))}
            </Tag>
            <span
              style={{
                fontSize: '12px',
                color: isProfit ? '#52c41a' : '#f5222d',
              }}
            >
              {percentage >= 0 ? '+' : ''}
              {percentage.toFixed(2)}%
            </span>
          </Space>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Investment) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Вы уверены, что хотите удалить эту инвестицию?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>
                <WalletOutlined /> Инвестиции
              </Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Добавить инвестицию
              </Button>
            </Col>
          </Row>

          {/* Статистика портфеля */}
          {portfolio && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Общая стоимость"
                    value={parseFloat(portfolio.totalValue)}
                    precision={2}
                    suffix="₽"
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Стоимость покупки"
                    value={parseFloat(portfolio.totalCost)}
                    precision={2}
                    suffix="₽"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Прибыль/Убыток"
                    value={parseFloat(portfolio.profitLoss)}
                    precision={2}
                    suffix="₽"
                    styles={{
                      content: {
                        color:
                          parseFloat(portfolio.profitLoss) >= 0
                            ? '#52c41a'
                            : '#f5222d',
                      },
                    }}
                    prefix={
                      parseFloat(portfolio.profitLoss) >= 0 ? (
                        <ArrowUpOutlined />
                      ) : (
                        <ArrowDownOutlined />
                      )
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Процент прибыли/убытка"
                    value={portfolio.profitLossPercentage}
                    precision={2}
                    suffix="%"
                    styles={{
                      content: {
                        color:
                          portfolio.profitLossPercentage >= 0
                            ? '#52c41a'
                            : '#f5222d',
                      },
                    }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Визуализация портфеля */}
          {portfolio && portfolioPieData.length > 0 && (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="Распределение портфеля">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={portfolioPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          const { name, percent } = props;
                          if (!name || percent === undefined) return '';
                          return `${name}: ${(percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {portfolioPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number | undefined) =>
                          value !== undefined ? formatAmount(value) : ''
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Прибыль/Убыток по активам">
                  {profitLossBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={profitLossBarData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tickFormatter={(value) => formatAmount(value)} />
                        <Tooltip
                          formatter={(value: number | undefined) =>
                            value !== undefined ? formatAmount(value) : ''
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="profitLoss"
                          name="Прибыль/Убыток"
                        >
                          {profitLossBarData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.profitLoss >= 0 ? '#52c41a' : '#f5222d'
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '50px',
                        color: '#999',
                      }}
                    >
                      Нет данных
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {/* Список инвестиций */}
          <Card title="Список инвестиций">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : investments.length === 0 ? (
              <Empty description="Нет инвестиций" />
            ) : (
              <Table
                columns={columns}
                dataSource={investments}
                rowKey="id"
                scroll={{ x: true }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Всего: ${total}`,
                }}
              />
            )}
          </Card>
        </Space>

        {/* Модальное окно для создания/редактирования */}
        <Modal
          title={editingInvestment ? 'Редактировать инвестицию' : 'Создать инвестицию'}
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
              label="Название актива"
              validateStatus={errors.assetName ? 'error' : ''}
              help={errors.assetName?.message}
            >
              <input
                type="text"
                placeholder="Например: AAPL, BTC, SBER"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                }}
                {...register('assetName')}
              />
            </Form.Item>

            <Form.Item
              label="Количество"
              validateStatus={errors.quantity ? 'error' : ''}
              help={errors.quantity?.message}
            >
              <InputNumber
                placeholder="Введите количество"
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                value={watch('quantity')}
                onChange={(value) => setValue('quantity', value || 0)}
              />
            </Form.Item>

            <Form.Item
              label="Цена покупки (₽)"
              validateStatus={errors.purchasePrice ? 'error' : ''}
              help={errors.purchasePrice?.message}
            >
              <InputNumber
                placeholder="Введите цену покупки"
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                value={watch('purchasePrice')}
                onChange={(value) => setValue('purchasePrice', value || 0)}
              />
            </Form.Item>

            <Form.Item
              label="Текущая цена (₽)"
              validateStatus={errors.currentPrice ? 'error' : ''}
              help={errors.currentPrice?.message}
            >
              <InputNumber
                placeholder="Введите текущую цену"
                style={{ width: '100%' }}
                min={0}
                step={0.01}
                value={watch('currentPrice')}
                onChange={(value) => setValue('currentPrice', value || 0)}
              />
            </Form.Item>

            <Form.Item
              label="Дата покупки"
              validateStatus={errors.purchaseDate ? 'error' : ''}
              help={errors.purchaseDate?.message}
            >
              <DatePicker
                placeholder="Выберите дату покупки"
                style={{ width: '100%' }}
                value={watch('purchaseDate') || undefined}
                onChange={(date) =>
                  setValue('purchaseDate', date, { shouldValidate: true })
                }
                format="DD.MM.YYYY"
                maxDate={dayjs()}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingInvestment ? 'Сохранить' : 'Создать'}
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

