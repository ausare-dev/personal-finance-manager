'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Button,
  Table,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  App,
  Tag,
  Row,
  Col,
  Statistic,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { walletsService } from '@/services/wallets.service';
import { currenciesService } from '@/services/currencies.service';
import type { Wallet, CreateWalletDto, UpdateWalletDto } from '@/types';

const { Title } = Typography;
const { Option } = Select;

// Схема валидации для формы
const walletSchema = yup.object({
  name: yup.string().required('Название кошелька обязательно'),
  currency: yup.string().required('Валюта обязательна'),
});

// Популярные валюты
const CURRENCIES = ['RUB', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KZT', 'BYN'];

export default function WalletsPage() {
  const { message } = App.useApp();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [baseCurrency, setBaseCurrency] = useState<string>('RUB');
  const [convertedBalances, setConvertedBalances] = useState<
    Record<string, string>
  >({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<CreateWalletDto>({
    resolver: yupResolver(walletSchema),
  });

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    if (wallets.length > 0) {
      convertAllBalances();
    }
  }, [wallets, baseCurrency]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const data = await walletsService.getAll();
      setWallets(data);
    } catch (error) {
      message.error('Ошибка при загрузке кошельков');
    } finally {
      setLoading(false);
    }
  };

  const convertAllBalances = async () => {
    const conversions: Record<string, string> = {};
    
    for (const wallet of wallets) {
      if (wallet.currency === baseCurrency) {
        conversions[wallet.id] = wallet.balance;
      } else {
        try {
          const result = await currenciesService.convert({
            amount: parseFloat(wallet.balance),
            from: wallet.currency,
            to: baseCurrency,
          });
          conversions[wallet.id] = result.result;
        } catch (error) {
          console.error(`Error converting ${wallet.currency} to ${baseCurrency}:`, error);
          conversions[wallet.id] = wallet.balance; // Fallback к оригинальному балансу
        }
      }
    }
    
    setConvertedBalances(conversions);
  };

  const handleCreate = () => {
    setEditingWallet(null);
    reset();
    setModalVisible(true);
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setValue('name', wallet.name);
    setValue('currency', wallet.currency);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await walletsService.delete(id);
      message.success('Кошелек удален');
      loadWallets();
    } catch (error) {
      message.error('Ошибка при удалении кошелька');
    }
  };

  const onSubmit = async (data: CreateWalletDto) => {
    try {
      if (editingWallet) {
        await walletsService.update(editingWallet.id, data);
        message.success('Кошелек обновлен');
      } else {
        await walletsService.create(data);
        message.success('Кошелек создан');
      }
      setModalVisible(false);
      reset();
      loadWallets();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || 'Ошибка при сохранении кошелька';
      message.error(errorMessage);
    }
  };

  const formatAmount = (amount: string | number, currency: string = 'RUB') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Расчет общей суммы в базовой валюте
  const totalBalance = wallets.reduce((sum, wallet) => {
    const converted = convertedBalances[wallet.id] || wallet.balance;
    return sum + parseFloat(converted);
  }, 0);

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Валюта',
      dataIndex: 'currency',
      key: 'currency',
      render: (currency: string) => <Tag>{currency}</Tag>,
    },
    {
      title: 'Баланс (оригинал)',
      dataIndex: 'balance',
      key: 'balance',
      align: 'right' as const,
      render: (balance: string, record: Wallet) => (
        <span
          style={{
            color: parseFloat(balance) >= 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold',
          }}
        >
          {formatAmount(balance, record.currency)}
        </span>
      ),
    },
    {
      title: `Баланс (${baseCurrency})`,
      key: 'converted',
      align: 'right' as const,
      render: (_: any, record: Wallet) => {
        const converted = convertedBalances[record.id] || record.balance;
        return (
          <span
            style={{
              color: parseFloat(converted) >= 0 ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
            }}
          >
            {formatAmount(converted, baseCurrency)}
          </span>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Wallet) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Редактировать
          </Button>
          <Popconfirm
            title="Вы уверены, что хотите удалить этот кошелек?"
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
                <WalletOutlined /> Кошельки
              </Title>
            </Col>
            <Col>
              <Space>
                <Select
                  value={baseCurrency}
                  onChange={setBaseCurrency}
                  style={{ width: 120 }}
                >
                  {CURRENCIES.map((curr) => (
                    <Option key={curr} value={curr}>
                      {curr}
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  Добавить кошелек
                </Button>
              </Space>
            </Col>
          </Row>

          {/* Общая статистика */}
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Всего кошельков"
                  value={wallets.length}
                  prefix={<WalletOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title={`Общий баланс (${baseCurrency})`}
                  value={totalBalance}
                  precision={2}
                  styles={{
                    content: {
                      color: totalBalance >= 0 ? '#52c41a' : '#ff4d4f',
                    },
                  }}
                  suffix={baseCurrency}
                />
              </Card>
            </Col>
          </Row>

          {/* Список кошельков */}
          <Card>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : wallets.length === 0 ? (
              <Empty description="Нет кошельков" />
            ) : (
              <Table
                dataSource={wallets}
                columns={columns}
                rowKey="id"
                pagination={false}
              />
            )}
          </Card>
        </Space>

        {/* Модальное окно для создания/редактирования */}
        <Modal
          title={editingWallet ? 'Редактировать кошелек' : 'Создать кошелек'}
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            reset();
          }}
          footer={null}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Form.Item
              label="Название"
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
            >
              <Input
                placeholder="Введите название кошелька"
                {...register('name')}
                onChange={(e) => setValue('name', e.target.value)}
              />
            </Form.Item>

            <Form.Item
              label="Валюта"
              validateStatus={errors.currency ? 'error' : ''}
              help={errors.currency?.message}
            >
              <Select
                placeholder="Выберите валюту"
                value={editingWallet?.currency}
                onChange={(value) => setValue('currency', value)}
                style={{ width: '100%' }}
              >
                {CURRENCIES.map((curr) => (
                  <Option key={curr} value={curr}>
                    {curr}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingWallet ? 'Сохранить' : 'Создать'}
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

