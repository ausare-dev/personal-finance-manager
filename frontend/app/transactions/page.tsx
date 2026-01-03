'use client';

import { useEffect, useState, useRef } from 'react';
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
	InputNumber,
	Select,
	Radio,
	DatePicker,
	Popconfirm,
	App,
	Tag,
	Row,
	Col,
	Spin,
	Empty,
} from 'antd';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	TransactionOutlined,
	SearchOutlined,
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import dayjs from 'dayjs';
import {
	transactionsService,
	TransactionsResponse,
} from '@/services/transactions.service';
import { walletsService } from '@/services/wallets.service';
import type {
	Transaction,
	CreateTransactionDto,
	FilterTransactionDto,
	Wallet,
} from '@/types';
import { format } from 'date-fns';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Схема валидации для формы
const transactionSchema = yup.object({
	walletId: yup.string().required('Кошелек обязателен'),
	amount: yup
		.number()
		.required('Сумма обязательна')
		.positive('Сумма должна быть положительной'),
	type: yup.string().oneOf(['income', 'expense']).required('Тип обязателен'),
	category: yup.string().required('Категория обязательна'),
	description: yup.string().nullable().optional(),
	date: yup.string().required('Дата обязательна'),
	tags: yup.array().of(yup.string()).nullable().optional(),
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
	'Зарплата',
	'Подарки',
	'Прочее',
];

export default function TransactionsPage() {
	const { message } = App.useApp();
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [wallets, setWallets] = useState<Wallet[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalVisible, setModalVisible] = useState(false);
	const [editingTransaction, setEditingTransaction] =
		useState<Transaction | null>(null);
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [filters, setFilters] = useState<FilterTransactionDto>({
		page: 1,
		limit: 10,
	});
	const [searchDescription, setSearchDescription] = useState('');

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
		reset,
		watch,
	} = useForm<CreateTransactionDto>({
		resolver: yupResolver(transactionSchema) as any,
	});

	const walletId = watch('walletId');

	useEffect(() => {
		loadWallets();
	}, []);

	const loadWallets = async () => {
		try {
			const data = await walletsService.getAll();
			setWallets(data);
		} catch (error) {
			message.error('Ошибка при загрузке кошельков');
		}
	};

	// Используем useRef для отслеживания предыдущих значений фильтров
	const prevFiltersRef = useRef<string>('');
	const isLoadingRef = useRef(false);
	
	useEffect(() => {
		// Предотвращаем параллельные запросы
		if (isLoadingRef.current) {
			return;
		}
		
		// Создаем строковое представление фильтров для сравнения
		const filtersKey = JSON.stringify({
			page: filters.page,
			limit: filters.limit,
			type: filters.type || null,
			category: filters.category || null,
			walletId: filters.walletId || null,
			startDate: filters.startDate || null,
			endDate: filters.endDate || null,
		});
		
		// Вызываем loadTransactions только если фильтры действительно изменились
		if (prevFiltersRef.current !== filtersKey) {
			prevFiltersRef.current = filtersKey;
			
			// Загружаем транзакции асинхронно
			const loadData = async () => {
				if (isLoadingRef.current) return;
				
				try {
					isLoadingRef.current = true;
					setLoading(true);
					
					const response: TransactionsResponse = await transactionsService.getAll(
						filters
					);
					
					setTransactions(prev => {
						// Проверяем, изменились ли данные перед обновлением
						const dataStr = JSON.stringify(response.data);
						const prevStr = JSON.stringify(prev);
						if (dataStr === prevStr) {
							return prev;
						}
						return response.data;
					});
					setPagination(prev => {
						// Проверяем, изменились ли значения перед обновлением
						if (prev.current === response.page && 
						    prev.pageSize === response.limit && 
						    prev.total === response.total) {
							return prev;
						}
						return {
							current: response.page,
							pageSize: response.limit,
							total: response.total,
						};
					});
				} catch (error) {
					message.error('Ошибка при загрузке транзакций');
				} finally {
					isLoadingRef.current = false;
					setLoading(false);
				}
			};
			
			loadData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters.page, filters.limit, filters.type, filters.category, filters.walletId, filters.startDate, filters.endDate]);

	const loadTransactions = async () => {
		if (isLoadingRef.current) return;
		
		try {
			isLoadingRef.current = true;
			setLoading(true);
			const response: TransactionsResponse = await transactionsService.getAll(
				filters
			);
			setTransactions(prev => {
				// Проверяем, изменились ли данные перед обновлением
				const dataStr = JSON.stringify(response.data);
				const prevStr = JSON.stringify(prev);
				if (dataStr === prevStr) {
					return prev;
				}
				return response.data;
			});
			setPagination(prev => {
				// Проверяем, изменились ли значения перед обновлением
				if (prev.current === response.page && 
				    prev.pageSize === response.limit && 
				    prev.total === response.total) {
					return prev;
				}
				return {
					current: response.page,
					pageSize: response.limit,
					total: response.total,
				};
			});
		} catch (error) {
			message.error('Ошибка при загрузке транзакций');
		} finally {
			isLoadingRef.current = false;
			setLoading(false);
		}
	};

	const handleCreate = () => {
		setEditingTransaction(null);
		reset();
		setModalVisible(true);
	};

	const handleEdit = (transaction: Transaction) => {
		setEditingTransaction(transaction);
		setValue('walletId', transaction.walletId);
		setValue('amount', parseFloat(transaction.amount));
		setValue('type', transaction.type);
		setValue('category', transaction.category);
		setValue('description', transaction.description || '');
		setValue('tags', transaction.tags);
		setValue('date', transaction.date);
		setModalVisible(true);
	};

	const handleDelete = async (id: string) => {
		try {
			await transactionsService.delete(id);
			message.success('Транзакция удалена');
			loadTransactions();
		} catch (error) {
			message.error('Ошибка при удалении транзакции');
		}
	};

	const onSubmit = async (data: CreateTransactionDto) => {
		try {
			if (editingTransaction) {
				await transactionsService.update(editingTransaction.id, data);
				message.success('Транзакция обновлена');
			} else {
				await transactionsService.create(data);
				message.success('Транзакция создана');
			}
			setModalVisible(false);
			reset();
			loadTransactions();
		} catch (error: any) {
			const errorMessage =
				error?.response?.data?.message || 'Ошибка при сохранении транзакции';
			message.error(errorMessage);
		}
	};

	const handleFilterChange = (key: keyof FilterTransactionDto, value: any) => {
		setFilters(prev => {
			// Проверяем, изменилось ли значение
			if (prev[key] === value && key !== 'page') {
				return prev; // Возвращаем тот же объект, если значение не изменилось
			}
			return {
				...prev,
				[key]: value,
				page: 1, // Сбрасываем на первую страницу при изменении фильтров
			};
		});
	};

	const handleSearch = () => {
		// Фильтрация по описанию происходит на клиенте через filteredTransactions
		// Не нужно вызывать loadTransactions
	};

	// Фильтрация транзакций по поисковому запросу на клиенте
	const filteredTransactions = searchDescription
		? transactions.filter(t =>
				t.description?.toLowerCase().includes(searchDescription.toLowerCase())
		  )
		: transactions;

	const handleResetFilters = () => {
		setFilters(prev => {
			// Проверяем, нужно ли сбрасывать
			const resetFilters = { page: 1, limit: 10 };
			if (prev.page === resetFilters.page && 
			    prev.limit === resetFilters.limit && 
			    !prev.type && 
			    !prev.category && 
			    !prev.walletId && 
			    !prev.startDate && 
			    !prev.endDate) {
				return prev; // Уже сброшено
			}
			return resetFilters;
		});
		setSearchDescription('');
	};

	const handleTableChange = (page: number, pageSize: number) => {
		setFilters(prev => {
			// Проверяем, изменились ли значения
			if (prev.page === page && prev.limit === pageSize) {
				return prev; // Возвращаем тот же объект, если значения не изменились
			}
			return {
				...prev,
				page,
				limit: pageSize,
			};
		});
	};

	const formatAmount = (amount: string | number, currency: string = 'RUB') => {
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: currency || 'RUB',
			minimumFractionDigits: 2,
		}).format(num);
	};

	const getWalletCurrency = (walletId: string) => {
		const wallet = wallets.find(w => w.id === walletId);
		return wallet?.currency || 'RUB';
	};

	const columns = [
		{
			title: 'Дата',
			dataIndex: 'date',
			key: 'date',
			render: (date: string) => format(new Date(date), 'dd.MM.yyyy HH:mm'),
			sorter: true,
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
			title: 'Кошелек',
			dataIndex: 'walletId',
			key: 'walletId',
			render: (walletId: string) => {
				const wallet = wallets.find(w => w.id === walletId);
				return wallet ? `${wallet.name} (${wallet.currency})` : walletId;
			},
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
			title: 'Теги',
			dataIndex: 'tags',
			key: 'tags',
			render: (tags: string[]) => (
				<Space size={[0, 8]} wrap>
					{tags?.map((tag, index) => (
						<Tag key={index}>{tag}</Tag>
					))}
				</Space>
			),
		},
		{
			title: 'Сумма',
			dataIndex: 'amount',
			key: 'amount',
			align: 'right' as const,
			render: (amount: string, record: Transaction) => {
				const currency = getWalletCurrency(record.walletId);
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
			sorter: true,
		},
		{
			title: 'Действия',
			key: 'actions',
			width: 150,
			render: (_: any, record: Transaction) => (
				<Space>
					<Button
						type='link'
						icon={<EditOutlined />}
						onClick={() => handleEdit(record)}
					>
						Редактировать
					</Button>
					<Popconfirm
						title='Вы уверены, что хотите удалить эту транзакцию?'
						onConfirm={() => handleDelete(record.id)}
						okText='Да'
						cancelText='Нет'
					>
						<Button type='link' danger icon={<DeleteOutlined />}>
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
				<Space orientation='vertical' size='large' style={{ width: '100%' }}>
					<Row justify='space-between' align='middle' gutter={[16, 16]}>
						<Col xs={24} sm={24} md={12}>
							<Title level={2} style={{ margin: 0 }}>
								<TransactionOutlined /> Транзакции
							</Title>
						</Col>
						<Col xs={24} sm={24} md={12} style={{ textAlign: 'right' }}>
							<Button
								type='primary'
								onClick={handleCreate}
								block
								className="responsive-button"
							>
								<span className="button-text">
									<PlusOutlined /> Добавить транзакцию
								</span>
								<span className="button-icon-only">
									<PlusOutlined />
								</span>
							</Button>
						</Col>
					</Row>

					{/* Фильтры */}
					<Card>
						<Row gutter={[16, 16]}>
							<Col xs={24} sm={12} md={6}>
								<Form.Item label='Тип'>
									<Radio.Group
										value={filters.type}
										onChange={e => handleFilterChange('type', e.target.value)}
									>
										<Radio.Button value={undefined}>Все</Radio.Button>
										<Radio.Button value='income'>Доход</Radio.Button>
										<Radio.Button value='expense'>Расход</Radio.Button>
									</Radio.Group>
								</Form.Item>
							</Col>

							<Col xs={24} sm={12} md={6}>
								<Form.Item label='Категория'>
									<Select
										placeholder='Все категории'
										allowClear
										value={filters.category}
										onChange={value => handleFilterChange('category', value)}
										style={{ width: '100%' }}
									>
										{CATEGORIES.map(cat => (
											<Option key={cat} value={cat}>
												{cat}
											</Option>
										))}
									</Select>
								</Form.Item>
							</Col>

							<Col xs={24} sm={12} md={6}>
								<Form.Item label='Кошелек'>
									<Select
										placeholder='Все кошельки'
										allowClear
										value={filters.walletId}
										onChange={value => handleFilterChange('walletId', value)}
										style={{ width: '100%' }}
									>
										{wallets.map(wallet => (
											<Option key={wallet.id} value={wallet.id}>
												{wallet.name} ({wallet.currency})
											</Option>
										))}
									</Select>
								</Form.Item>
							</Col>

							<Col xs={24} sm={12} md={6}>
								<Form.Item label='Период'>
									<RangePicker
										style={{ width: '100%' }}
										onChange={(dates) => {
											if (dates && dates[0] && dates[1]) {
												const [startDate, endDate] = dates;
												const newStartDate = startDate.toISOString();
												const newEndDate = endDate.toISOString();
												setFilters(prev => {
													// Проверяем, изменились ли даты
													if (prev.startDate === newStartDate && prev.endDate === newEndDate && prev.page === 1) {
														return prev;
													}
													return {
														...prev,
														startDate: newStartDate,
														endDate: newEndDate,
														page: 1,
													};
												});
											} else {
												setFilters(prev => {
													// Проверяем, были ли даты уже undefined
													if (!prev.startDate && !prev.endDate && prev.page === 1) {
														return prev;
													}
													return {
														...prev,
														startDate: undefined,
														endDate: undefined,
														page: 1,
													};
												});
											}
										}}
									/>
								</Form.Item>
							</Col>

							<Col xs={24} sm={12} md={12}>
								<Space.Compact style={{ width: '100%' }}>
									<Input
										placeholder='Поиск по описанию'
										value={searchDescription}
										onChange={e => setSearchDescription(e.target.value)}
										onPressEnter={handleSearch}
									/>
									<Button
										type='primary'
										icon={<SearchOutlined />}
										onClick={handleSearch}
									>
										Поиск
									</Button>
								</Space.Compact>
							</Col>

							<Col xs={24} sm={12} md={12}>
								<Button onClick={handleResetFilters}>Сбросить фильтры</Button>
							</Col>
						</Row>
					</Card>

					{/* Таблица транзакций */}
					<Card>
						{loading ? (
							<div style={{ textAlign: 'center', padding: '50px' }}>
								<Spin size='large' />
							</div>
						) : filteredTransactions.length === 0 ? (
							<Empty description='Нет транзакций' />
						) : (
							<>
								{/* Десктопная таблица */}
								<div className="desktop-table">
									<Table
										dataSource={filteredTransactions}
										columns={columns}
										rowKey='id'
										pagination={{
											current: pagination.current,
											pageSize: pagination.pageSize,
											total: pagination.total,
											showSizeChanger: true,
											showTotal: total => `Всего ${total} транзакций`,
											onChange: handleTableChange,
											onShowSizeChange: handleTableChange,
										}}
										scroll={{ x: 'max-content' }}
									/>
								</div>
								
								{/* Мобильные карточки */}
								<div className="mobile-cards">
									<Space orientation="vertical" size="middle" style={{ width: '100%' }}>
										{filteredTransactions.map((transaction) => {
											const wallet = wallets.find(w => w.id === transaction.walletId);
											const currency = wallet?.currency || 'RUB';
											return (
												<Card
													key={transaction.id}
													size="small"
													style={{
														borderLeft: `4px solid ${transaction.type === 'income' ? '#52c41a' : '#ff4d4f'}`,
													}}
													actions={[
														<Button
															type="link"
															icon={<EditOutlined />}
															onClick={() => handleEdit(transaction)}
															key="edit"
														>
															Редактировать
														</Button>,
														<Popconfirm
															key="delete"
															title='Вы уверены?'
															onConfirm={() => handleDelete(transaction.id)}
															okText='Да'
															cancelText='Нет'
														>
															<Button type="link" danger icon={<DeleteOutlined />}>
																Удалить
															</Button>
														</Popconfirm>,
													]}
												>
													<Space orientation="vertical" size="small" style={{ width: '100%' }}>
														<Row justify="space-between" align="middle">
															<Col>
																<Tag color={transaction.type === 'income' ? 'green' : 'red'}>
																	{transaction.type === 'income' ? 'Доход' : 'Расход'}
																</Tag>
															</Col>
															<Col>
																<span
																	style={{
																		color: transaction.type === 'income' ? '#52c41a' : '#ff4d4f',
																		fontWeight: 'bold',
																		fontSize: '18px',
																	}}
																>
																	{transaction.type === 'income' ? '+' : '-'}
																	{formatAmount(transaction.amount, currency)}
																</span>
															</Col>
														</Row>
														<div>
															<Text strong>{transaction.category}</Text>
														</div>
														{transaction.description && (
															<div>
																<Text type="secondary">{transaction.description}</Text>
															</div>
														)}
														<Row justify="space-between">
															<Col>
																<Text type="secondary" style={{ fontSize: '12px' }}>
																	{format(new Date(transaction.date), 'dd.MM.yyyy HH:mm')}
																</Text>
															</Col>
															{wallet && (
																<Col>
																	<Tag>{wallet.name} ({wallet.currency})</Tag>
																</Col>
															)}
														</Row>
														{transaction.tags && transaction.tags.length > 0 && (
															<div>
																<Space size={[0, 8]} wrap>
																	{transaction.tags.map((tag, index) => (
																		<Tag key={index} style={{ fontSize: '12px' }}>{tag}</Tag>
																	))}
																</Space>
															</div>
														)}
													</Space>
												</Card>
											);
										})}
									</Space>
									
									{/* Пагинация для мобильных */}
									{pagination.total > 0 && (
										<div style={{ marginTop: 16, textAlign: 'center' }}>
											<Space>
												<Button
													disabled={pagination.current === 1}
													onClick={() => handleTableChange(pagination.current - 1, pagination.pageSize)}
												>
													Назад
												</Button>
												<Text>
													Страница {pagination.current} из {Math.max(1, Math.ceil(pagination.total / pagination.pageSize))}
												</Text>
												<Button
													disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
													onClick={() => handleTableChange(pagination.current + 1, pagination.pageSize)}
												>
													Вперед
												</Button>
											</Space>
											<div style={{ marginTop: 8 }}>
												<Text type="secondary" style={{ fontSize: '12px' }}>
													Всего {pagination.total} транзакций
												</Text>
											</div>
										</div>
									)}
								</div>
							</>
						)}
					</Card>
				</Space>

				{/* Модальное окно для создания/редактирования */}
				<Modal
					title={
						editingTransaction
							? 'Редактировать транзакцию'
							: 'Создать транзакцию'
					}
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
							label='Тип'
							validateStatus={errors.type ? 'error' : ''}
							help={errors.type?.message}
						>
							<Radio.Group
								value={watch('type')}
								onChange={e => setValue('type', e.target.value)}
							>
								<Radio value='income'>Доход</Radio>
								<Radio value='expense'>Расход</Radio>
							</Radio.Group>
						</Form.Item>

						<Form.Item
							label='Кошелек'
							validateStatus={errors.walletId ? 'error' : ''}
							help={errors.walletId?.message}
						>
							<Select
								placeholder='Выберите кошелек'
								value={walletId}
								onChange={value => setValue('walletId', value)}
								style={{ width: '100%' }}
							>
								{wallets.map(wallet => (
									<Option key={wallet.id} value={wallet.id}>
										{wallet.name} ({wallet.currency})
									</Option>
								))}
							</Select>
						</Form.Item>

						<Form.Item
							label='Сумма'
							validateStatus={errors.amount ? 'error' : ''}
							help={errors.amount?.message}
						>
							<InputNumber
								placeholder='Введите сумму'
								style={{ width: '100%' }}
								min={0}
								step={0.01}
								value={watch('amount')}
								onChange={value => setValue('amount', value || 0)}
							/>
						</Form.Item>

						<Form.Item
							label='Категория'
							validateStatus={errors.category ? 'error' : ''}
							help={errors.category?.message}
						>
							<Select
								placeholder='Выберите категорию'
								value={watch('category')}
								onChange={value => setValue('category', value)}
								style={{ width: '100%' }}
								showSearch
							>
								{CATEGORIES.map(cat => (
									<Option key={cat} value={cat}>
										{cat}
									</Option>
								))}
							</Select>
						</Form.Item>

						<Form.Item label='Описание'>
							<TextArea
								placeholder='Введите описание'
								rows={3}
								value={watch('description')}
								onChange={e => setValue('description', e.target.value)}
							/>
						</Form.Item>

						<Form.Item label='Дата'>
							<DatePicker
								style={{ width: '100%' }}
								showTime
								value={watch('date') ? dayjs(watch('date')) : null}
								onChange={date =>
									setValue('date', date ? date.toISOString() : '')
								}
							/>
						</Form.Item>

						<Form.Item label='Теги'>
							<Select
								mode='tags'
								placeholder='Добавьте теги'
								style={{ width: '100%' }}
								value={watch('tags')}
								onChange={value => setValue('tags', value)}
							/>
						</Form.Item>

						<Form.Item>
							<Space>
								<Button type='primary' htmlType='submit'>
									{editingTransaction ? 'Сохранить' : 'Создать'}
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
