'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import {
  Typography,
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Space,
  Spin,
  Statistic,
  App,
} from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChartOutlined,
  DownloadOutlined,
  AimOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { analyticsService } from '@/services/analytics.service';
import { goalsService } from '@/services/goals.service';
import { investmentsService, type PortfolioSummary } from '@/services/investments.service';
import type {
  AnalyticsOverview,
  IncomeExpenseData,
  CategoryData,
  TrendData,
  Goal,
} from '@/types';
import type { AnalyticsFilters } from '@/services/analytics.service';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

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

export default function AnalyticsPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [incomeExpenseData, setIncomeExpenseData] = useState<
    IncomeExpenseData[]
  >([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);

  // Фильтры
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, groupBy]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const filters: AnalyticsFilters = {
        startDate: dateRange[0]?.toISOString(),
        endDate: dateRange[1]?.toISOString(),
        groupBy,
      };

      // Загружаем данные параллельно
      const [overviewData, incomeExpense, categories, trends, goalsData, portfolioData] =
        await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getIncomeExpense(filters).catch(() => []), // Если ошибка, возвращаем пустой массив
          analyticsService.getByCategory({ ...filters, type: 'expense' }).catch(() => []), // Только расходы для секции "Расходы по категориям"
          analyticsService.getTrends(filters).catch(() => []), // Если ошибка, возвращаем пустой массив
          goalsService.getAll().catch(() => []), // Если ошибка, возвращаем пустой массив
          investmentsService.getPortfolio().catch(() => null), // Если ошибка, возвращаем null
        ]);

      setOverview(overviewData);
      setIncomeExpenseData(Array.isArray(incomeExpense) ? incomeExpense : []);
      setCategoryData(Array.isArray(categories) ? categories : []);
      setTrendData(Array.isArray(trends) ? trends : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setPortfolio(portfolioData);
    } catch (error) {
      message.error('Ошибка при загрузке аналитики');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Подготовка данных для графика доходов/расходов (Line Chart)
  const lineChartData = (Array.isArray(incomeExpenseData) ? incomeExpenseData : []).map((item) => ({
    period: item.period,
    income: parseFloat(item.income),
    expense: Math.abs(parseFloat(item.expense)),
    net: parseFloat(item.net),
  }));

  // Подготовка данных для круговой диаграммы (Pie Chart)
  const pieChartData = (Array.isArray(categoryData) ? categoryData : []).map((item) => ({
    name: item.category,
    value: Math.abs(parseFloat(item.total)),
    count: item.count,
  }));

  // Подготовка данных для столбчатой диаграммы (Bar Chart)
  const barChartData = (Array.isArray(trendData) ? trendData : []).map((item) => ({
    date: item.date,
    income: parseFloat(item.income),
    expense: Math.abs(parseFloat(item.expense)),
  }));

  // Подготовка данных для графика прогресса целей
  const goalsProgressData = (Array.isArray(goals) ? goals : []).map((goal) => ({
    name: goal.name,
    current: parseFloat(goal.currentAmount),
    target: parseFloat(goal.targetAmount),
    progress: goal.progressPercentage || 0,
  }));

  // Подготовка данных для графика инвестиционного портфеля
  const portfolioPieData = portfolio?.investments.map((inv, index) => ({
    name: inv.assetName,
    value: parseFloat(inv.totalValue || '0'),
    profitLoss: parseFloat(inv.profitLoss || '0'),
    profitLossPercentage: inv.profitLossPercentage || 0,
  })) || [];

  // Функция экспорта графика (опционально - базовый вариант)
  const exportChart = (chartId: string, filename: string) => {
    message.info('Экспорт графиков будет реализован в следующих версиях');
    // В будущем можно использовать html2canvas для экспорта
  };

  // Кастомный Tooltip для графиков
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: '#fff',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              style={{
                margin: '5px 0',
                color: entry.color,
              }}
            >
              {`${entry.name}: ${formatAmount(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>
                <BarChartOutlined /> Аналитика
              </Title>
            </Col>
            <Col>
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) =>
                    setDateRange([
                      dates?.[0] || null,
                      dates?.[1] || null,
                    ])
                  }
                  format="DD.MM.YYYY"
                />
                <Select
                  value={groupBy}
                  onChange={setGroupBy}
                  style={{ width: 120 }}
                >
                  <Option value="day">По дням</Option>
                  <Option value="week">По неделям</Option>
                  <Option value="month">По месяцам</Option>
                </Select>
              </Space>
            </Col>
          </Row>

          {/* Общая статистика */}
          {overview && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Общий доход"
                    value={parseFloat(overview.totalIncome)}
                    precision={2}
                    suffix="₽"
                    styles={{ content: { color: '#52c41a' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Общий расход"
                    value={parseFloat(overview.totalExpense)}
                    precision={2}
                    suffix="₽"
                    styles={{ content: { color: '#f5222d' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Баланс"
                    value={parseFloat(overview.netBalance || '0') || 0}
                    precision={2}
                    suffix="₽"
                    styles={{
                      content: {
                        color:
                          parseFloat(overview.netBalance || '0') >= 0
                            ? '#52c41a'
                            : '#f5222d',
                      },
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Транзакций"
                    value={overview.transactionCount}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {/* График доходов и расходов (Line Chart) */}
              <Card title="Динамика доходов и расходов">
                <div style={{ width: '100%', height: 300, minHeight: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="period"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tickFormatter={(value) => formatAmount(value)} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#52c41a"
                        strokeWidth={2}
                        name="Доходы"
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#f5222d"
                        strokeWidth={2}
                        name="Расходы"
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        stroke="#1890ff"
                        strokeWidth={2}
                        name="Баланс"
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Row gutter={[16, 16]}>
                {/* Круговая диаграмма по категориям (Pie Chart) */}
                <Col xs={24} md={24} lg={12}>
                  <Card title="Расходы по категориям">
                    {pieChartData.length > 0 ? (
                      <div style={{ width: '100%', height: 300, minHeight: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieChartData}
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
                            {pieChartData.map((entry, index) => (
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
                      </div>
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

                {/* Столбчатая диаграмма динамики (Bar Chart) */}
                <Col xs={24} md={24} lg={12}>
                  <Card title="Тренды доходов и расходов">
                    {barChartData.length > 0 ? (
                      <div style={{ width: '100%', height: 300, minHeight: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tickFormatter={(value) => formatAmount(value)} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Bar dataKey="income" fill="#52c41a" name="Доходы" />
                          <Bar dataKey="expense" fill="#f5222d" name="Расходы" />
                        </BarChart>
                      </ResponsiveContainer>
                      </div>
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

              {/* График трендов с областью (Area Chart) */}
              {trendData.length > 0 && (
                <Card
                  title="Тренды доходов и расходов"
                  extra={
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => exportChart('trends-chart', 'trends')}
                      size="small"
                    >
                      Экспорт
                    </Button>
                  }
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={barChartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f5222d" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f5222d" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tickFormatter={(value) => formatAmount(value)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#52c41a"
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                        name="Доходы"
                      />
                      <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#f5222d"
                        fillOpacity={1}
                        fill="url(#colorExpense)"
                        name="Расходы"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* График прогресса целей */}
              {goals.length > 0 && (
                <Card
                  title={
                    <Space>
                      <AimOutlined />
                      <span>Прогресс финансовых целей</span>
                    </Space>
                  }
                  extra={
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => exportChart('goals-chart', 'goals')}
                      size="small"
                    >
                      Экспорт
                    </Button>
                  }
                >
                  <div style={{ width: '100%', height: 300, minHeight: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={goalsProgressData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => formatAmount(value)} tick={{ fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number | undefined) =>
                          value !== undefined ? formatAmount(value) : ''
                        }
                        labelFormatter={(label) => `Цель: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="current"
                        fill="#1890ff"
                        name="Текущая сумма"
                        stackId="a"
                      />
                      <Bar
                        dataKey="target"
                        fill="#d9d9d9"
                        name="Целевая сумма"
                        stackId="a"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* График инвестиционного портфеля */}
              {portfolio && portfolioPieData.length > 0 && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <WalletOutlined />
                          <span>Распределение инвестиционного портфеля</span>
                        </Space>
                      }
                      extra={
                        <Button
                          icon={<DownloadOutlined />}
                          onClick={() => exportChart('portfolio-chart', 'portfolio')}
                          size="small"
                        >
                          Экспорт
                        </Button>
                      }
                    >
                      <div style={{ width: '100%', height: 300, minHeight: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
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
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={24} lg={12}>
                    <Card title="Статистика портфеля">
                      <Space orientation="vertical" style={{ width: '100%' }} size="large">
                        <Statistic
                          title="Общая стоимость"
                          value={parseFloat(portfolio.totalValue)}
                          precision={2}
                          suffix="₽"
                          styles={{ content: { color: '#1890ff' } }}
                        />
                        <Statistic
                          title="Общая стоимость покупки"
                          value={parseFloat(portfolio.totalCost)}
                          precision={2}
                          suffix="₽"
                        />
                        <Statistic
                          title="Прибыль/Убыток"
                          value={parseFloat(portfolio.profitLoss || '0') || 0}
                          precision={2}
                          suffix="₽"
                          styles={{
                            content: {
                              color:
                                parseFloat(portfolio.profitLoss || '0') >= 0
                                  ? '#52c41a'
                                  : '#f5222d',
                            },
                          }}
                        />
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
                      </Space>
                    </Card>
                  </Col>
                </Row>
              )}

              {/* Детальная таблица по категориям */}
              {categoryData.length > 0 && (
                <Card title="Детализация по категориям">
                  <Row gutter={[16, 16]}>
                    {categoryData.map((item, index) => {
                      const totalValue = parseFloat(item.total || '0') || 0;
                      return (
                        <Col xs={24} sm={12} md={12} lg={8} xl={6} key={item.category || index}>
                          <Card size="small">
                            <Statistic
                              title={item.category}
                              value={totalValue}
                              precision={2}
                              suffix="₽"
                              prefix={totalValue < 0 ? '-' : ''}
                              styles={{
                                content: {
                                  color:
                                    totalValue < 0
                                      ? '#f5222d'
                                      : '#52c41a',
                                  fontSize: '16px',
                                },
                              }}
                            />
                            <div style={{ marginTop: 8, color: '#999' }}>
                              Транзакций: {item.count || 0}
                            </div>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>
              )}
            </>
          )}
        </Space>
      </MainLayout>
    </ProtectedRoute>
  );
}

