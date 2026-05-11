'use client';

import type { ReactNode } from 'react';
import { useEffect, useState, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Button,
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
import type { Wallet, CreateWalletDto } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

const walletSchema = yup.object({
  name: yup.string().required('Название кошелька обязательно'),
  currency: yup.string().required('Валюта обязательна'),
});

const CURRENCIES = ['RUB', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'KZT', 'BYN'];

/** Маркер: конвертация в базовую валюту не удалась (нельзя показывать оригинал как базовую) */
const CONVERT_FAIL = '__CONVERT_FAIL__';

const formatAmount = (amount: string | number, currency: string = 'RUB') => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const code = (currency || 'RUB').toUpperCase();
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
  }).format(num);
};

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

  const loadWallets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await walletsService.getAll();
      setWallets(data);
    } catch {
      message.error('Ошибка при загрузке кошельков');
    } finally {
      setLoading(false);
    }
  }, [message]);

  const convertAllBalances = useCallback(async () => {
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
          if ('error' in result) {
            conversions[wallet.id] = CONVERT_FAIL;
          } else {
            conversions[wallet.id] = String(result.converted);
          }
        } catch {
          conversions[wallet.id] = CONVERT_FAIL;
        }
      }
    }
    setConvertedBalances(conversions);
  }, [wallets, baseCurrency]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  useEffect(() => {
    if (wallets.length > 0) {
      convertAllBalances();
    }
  }, [wallets, baseCurrency, convertAllBalances]);

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
    } catch {
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
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      message.error(
        err?.response?.data?.message ?? 'Ошибка при сохранении кошелька'
      );
    }
  };

  const renderBalanceInBase = (wallet: Wallet): ReactNode => {
    if (wallet.currency === baseCurrency) {
      return (
        <span style={{ color: balanceColor(wallet.balance), fontWeight: 600 }}>
          {formatAmount(wallet.balance, baseCurrency)}
        </span>
      );
    }
    const v = convertedBalances[wallet.id];
    if (v === CONVERT_FAIL) {
      return <Text type="secondary">нет курса</Text>;
    }
    if (v === undefined) {
      return <Spin size="small" />;
    }
    return (
      <span style={{ color: balanceColor(v), fontWeight: 600 }}>
        {formatAmount(parseFloat(v), baseCurrency)}
      </span>
    );
  };

  const totalBalance = wallets.reduce((sum, wallet) => {
    if (wallet.currency === baseCurrency) {
      return sum + parseFloat(wallet.balance);
    }
    const v = convertedBalances[wallet.id];
    if (v === undefined || v === CONVERT_FAIL) {
      return sum;
    }
    return sum + parseFloat(v);
  }, 0);

  const balanceColor = (value: string) =>
    parseFloat(value) >= 0 ? '#52c41a' : '#ff4d4f';

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ width: '100%', maxWidth: '100%' }}>
          <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
            <Col xs={24} md={12}>
              <Title level={2} style={{ margin: 0 }}>
                <WalletOutlined /> Кошельки
              </Title>
            </Col>
            <Col xs={24} md={12}>
              <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
                <Select
                  value={baseCurrency}
                  onChange={setBaseCurrency}
                  style={{ width: '100%', minWidth: 120 }}
                  size="large"
                >
                  {CURRENCIES.map((c) => (
                    <Option key={c} value={c}>
                      {c}
                    </Option>
                  ))}
                </Select>
                <Button type="primary" onClick={handleCreate} block size="large">
                  <PlusOutlined /> Добавить кошелек
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card size="small">
                <Statistic
                  title="Всего кошельков"
                  value={wallets.length}
                  prefix={<WalletOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small">
                <Statistic
                  title={`Общий баланс (${baseCurrency})`}
                  value={totalBalance}
                  precision={2}
                  styles={{
                    content: { color: balanceColor(String(totalBalance)) },
                  }}
                  suffix={baseCurrency}
                />
              </Card>
            </Col>
          </Row>

          <Card styles={{ body: { padding: 0 } }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <Spin size="large" />
              </div>
            ) : wallets.length === 0 ? (
              <div style={{ padding: 24 }}>
                <Empty description="Нет кошельков" />
              </div>
            ) : (
              <>
                <div className="wallets-mobile-list">
                  {wallets.map((wallet) => {
                    return (
                      <div
                        key={wallet.id}
                        className="wallet-card"
                        style={{
                          padding: 16,
                          borderBottom:
                            '1px solid var(--ant-color-border-secondary, #f0f0f0)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            flexWrap: 'wrap',
                            gap: 12,
                          }}
                        >
                          <div>
                            <Typography.Text strong style={{ fontSize: 16 }}>
                              {wallet.name}
                            </Typography.Text>
                            <div style={{ marginTop: 4 }}>
                              <Tag>{wallet.currency}</Tag>
                            </div>
                            <div
                              style={{
                                marginTop: 8,
                                color: balanceColor(wallet.balance),
                                fontWeight: 600,
                              }}
                            >
                              {formatAmount(wallet.balance, wallet.currency)}
                            </div>
                            {wallet.currency !== baseCurrency && (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 12,
                                  color: 'var(--ant-color-text-secondary)',
                                }}
                              >
                                {renderBalanceInBase(wallet)}
                              </div>
                            )}
                          </div>
                          <Space size="small">
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => handleEdit(wallet)}
                              title="Редактировать"
                            />
                            <Popconfirm
                              title="Удалить этот кошелек?"
                              onConfirm={() => handleDelete(wallet.id)}
                              okText="Да"
                              cancelText="Нет"
                              overlayClassName="popconfirm-mobile-large"
                              overlayStyle={{
                                minWidth: 260,
                                width: 'min(280px, calc(100vw - 24px))',
                              }}
                            >
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                title="Удалить"
                              />
                            </Popconfirm>
                          </Space>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="wallets-desktop-table">
                  <div
                    style={{
                      overflowX: 'auto',
                      overflowY: 'visible',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        minWidth: 640,
                        borderCollapse: 'collapse',
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            borderBottom:
                              '1px solid var(--ant-color-border-secondary)',
                            background: 'var(--ant-color-fill-quaternary, #fafafa)',
                          }}
                        >
                          <th
                            style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: 600,
                            }}
                          >
                            Название
                          </th>
                          <th
                            style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontWeight: 600,
                            }}
                          >
                            Валюта
                          </th>
                          <th
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              fontWeight: 600,
                            }}
                          >
                            Баланс (оригинал)
                          </th>
                          <th
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              fontWeight: 600,
                            }}
                          >
                            Баланс ({baseCurrency})
                          </th>
                          <th
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {wallets.map((wallet) => {
                          return (
                            <tr
                              key={wallet.id}
                              style={{
                                borderBottom:
                                  '1px solid var(--ant-color-border-secondary)',
                              }}
                            >
                              <td style={{ padding: '12px 16px' }}>
                                {wallet.name}
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <Tag>{wallet.currency}</Tag>
                              </td>
                              <td
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'right',
                                  color: balanceColor(wallet.balance),
                                  fontWeight: 600,
                                }}
                              >
                                {formatAmount(wallet.balance, wallet.currency)}
                              </td>
                              <td
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'right',
                                }}
                              >
                                {renderBalanceInBase(wallet)}
                              </td>
                              <td
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'right',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Space size="small">
                                  <Button
                                    type="link"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(wallet)}
                                  >
                                    Редактировать
                                  </Button>
                                  <Popconfirm
                                    title="Удалить этот кошелек?"
                                    onConfirm={() => handleDelete(wallet.id)}
                                    okText="Да"
                                    cancelText="Нет"
                                    overlayClassName="popconfirm-mobile-large"
                                    overlayStyle={{
                                      minWidth: 260,
                                      width: 'min(280px, calc(100vw - 24px))',
                                    }}
                                  >
                                    <Button
                                      type="link"
                                      size="small"
                                      danger
                                      icon={<DeleteOutlined />}
                                    >
                                      Удалить
                                    </Button>
                                  </Popconfirm>
                                </Space>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

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
                placeholder="Название кошелька"
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
                placeholder="Валюта"
                value={editingWallet?.currency}
                onChange={(v) => setValue('currency', v)}
                style={{ width: '100%' }}
              >
                {CURRENCIES.map((c) => (
                  <Option key={c} value={c}>
                    {c}
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
