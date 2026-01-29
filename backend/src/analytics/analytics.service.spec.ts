import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { Wallet } from '../entities/wallet.entity';
import { TransactionsService } from '../transactions/transactions.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  const mockTransactionRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockWalletRepository = {
    find: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockTransactionsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockWalletRepository,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.andWhere.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview stats', async () => {
      const userId = 'user-123';
      const transactions: Partial<Transaction>[] = [
        { type: TransactionType.INCOME, amount: 5000 },
        { type: TransactionType.EXPENSE, amount: 2000 },
      ];
      const wallets: Partial<Wallet>[] = [{ balance: 3000 }];

      mockTransactionRepository.find.mockResolvedValue(transactions);
      mockWalletRepository.find.mockResolvedValue(wallets);

      const result = await service.getOverview(userId);

      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpense).toBe(2000);
      expect(result.netAmount).toBe(3000);
      expect(result.totalWallets).toBe(1);
      expect(result.totalBalance).toBe(3000);
      expect(result.transactionsCount).toBe(2);
      expect(result.incomeCount).toBe(1);
      expect(result.expenseCount).toBe(1);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockWalletRepository.find).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('getIncomeExpense', () => {
    it('should return income/expense data by period', async () => {
      const userId = 'user-123';
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const transactions: Partial<Transaction>[] = [
        {
          type: TransactionType.INCOME,
          amount: 1000,
          date: new Date('2024-01-15'),
        },
        {
          type: TransactionType.EXPENSE,
          amount: 300,
          date: new Date('2024-01-15'),
        },
      ];

      mockTransactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getMany.mockResolvedValue(transactions);

      const result = await service.getIncomeExpense(userId, start, end, 'day');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('period');
      expect(result[0]).toHaveProperty('income');
      expect(result[0]).toHaveProperty('expense');
      expect(result[0]).toHaveProperty('net');
    });
  });

  describe('getByCategory', () => {
    it('should return category stats', async () => {
      const userId = 'user-123';
      const transactions: Partial<Transaction>[] = [
        { category: 'Food', type: TransactionType.EXPENSE, amount: 500 },
        { category: 'Food', type: TransactionType.EXPENSE, amount: 300 },
        { category: 'Transport', type: TransactionType.EXPENSE, amount: 200 },
      ];

      mockTransactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getMany.mockResolvedValue(transactions);

      const result = await service.getByCategory(userId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      const food = result.find((r) => r.category === 'Food');
      expect(food).toBeDefined();
      expect(food!.totalAmount).toBe(800);
      expect(food!.transactionCount).toBe(2);
      expect(food!.percentage).toBeDefined();
    });
  });

  describe('getTrends', () => {
    it('should return trend data', async () => {
      const userId = 'user-123';
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      const transactions: Partial<Transaction>[] = [
        {
          type: TransactionType.INCOME,
          amount: 1000,
          date: new Date('2024-01-10'),
        },
        {
          type: TransactionType.EXPENSE,
          amount: 400,
          date: new Date('2024-01-10'),
        },
      ];

      mockTransactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getMany.mockResolvedValue(transactions);

      const result = await service.getTrends(userId, start, end, 'day');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('income');
      expect(result[0]).toHaveProperty('expense');
      expect(result[0]).toHaveProperty('net');
    });
  });
});
