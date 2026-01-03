'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  Empty,
  Space,
} from 'antd';
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analytics.service';
import { walletsService } from '@/services/wallets.service';
import { transactionsService } from '@/services/transactions.service';
import type { AnalyticsOverview, Wallet, Transaction } from '@/types';
import { format } from 'date-fns';

const { Title } = Typography;

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Загружаем данные параллельно
      const [overviewData, walletsData, transactionsData] = await Promise.all([
        analyticsService.getOverview(),
        walletsService.getAll(),
        transactionsService.getAll({ page: 1, limit: 10 }),
      ]);

      setOverview(overviewData);
      setWallets(walletsData);
      setRecentTransactions(transactionsData.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Форматирование суммы
  const formatAmount = (amount: string | number, currency: string = 'RUB') => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Колонки для таблицы транзакций
  const transactionColumns = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) =>
        format(new Date(date), 'dd.MM.yyyy HH:mm'),
      width: 150,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'income' ? 'green' : 'red'}>
          {type === 'income' ? 'Доход' : 'Расход'}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Сумма',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right' as const,
      render: (amount: string, record: Transaction) => {
        // Находим валюту кошелька для транзакции
        const wallet = wallets.find((w) => w.id === record.walletId);
        const currency = wallet?.currency || 'RUB';
        
        return (
          <span
            style={{
              color: record.type === 'income' ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
            }}
          >
            {record.type === 'income' ? '+' : '-'}
            {formatAmount(amount, currency)}
          </span>
        );
      },
    },
  ];

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
          <div>
            <Title level={2} style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}>
              Добро пожаловать, {user?.email}!
            </Title>
          </div>

          {/* Карточки общей статистики */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Общий доход"
                  value={overview?.totalIncome || 0}
                  precision={2}
                  prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                  styles={{ content: { color: '#52c41a' } }}
                  suffix="₽"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Общий расход"
                  value={overview?.totalExpense || 0}
                  precision={2}
                  prefix={<ArrowDownOutlined style={{ color: '#ff4d4f' }} />}
                  styles={{ content: { color: '#ff4d4f' } }}
                  suffix="₽"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Чистый баланс"
                  value={overview?.netBalance || 0}
                  precision={2}
                  prefix={<DollarOutlined />}
                  styles={{
                    content: {
                      color:
                        parseFloat(overview?.netBalance || '0') >= 0
                          ? '#52c41a'
                          : '#ff4d4f',
                    },
                  }}
                  suffix="₽"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Кошельков"
                  value={overview?.walletCount || 0}
                  prefix={<WalletOutlined />}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                  Транзакций: {overview?.transactionCount || 0}
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* Кошельки */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <WalletOutlined />
                    <span>Кошельки</span>
                  </Space>
                }
                extra={<a href="/wallets">Управление</a>}
              >
                {wallets.length === 0 ? (
                  <Empty description="Нет кошельков" />
                ) : (
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    {wallets.map((wallet) => (
                      <Card
                        key={wallet.id}
                        size="small"
                        style={{ marginBottom: 8 }}
                      >
                        <Row justify="space-between" align="middle">
                          <Col>
                            <div style={{ fontWeight: 'bold' }}>
                              {wallet.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                              {wallet.currency}
                            </div>
                          </Col>
                          <Col>
                            <div
                              style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color:
                                  parseFloat(wallet.balance) >= 0
                                    ? '#52c41a'
                                    : '#ff4d4f',
                              }}
                            >
                              {formatAmount(wallet.balance, wallet.currency)}
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>

            {/* Последние транзакции */}
            <Col xs={24} md={24} lg={12}>
              <Card
                title={
                  <Space>
                    <TransactionOutlined />
                    <span>Последние транзакции</span>
                  </Space>
                }
                extra={<a href="/transactions">Все транзакции</a>}
              >
                {recentTransactions.length === 0 ? (
                  <Empty description="Нет транзакций" />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <Table
                      dataSource={recentTransactions}
                      columns={transactionColumns}
                      pagination={false}
                      rowKey="id"
                      size="small"
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}
