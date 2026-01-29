import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { TransactionType } from '../entities/transaction.entity';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: AnalyticsService;

  const mockAnalyticsService = {
    getOverview: jest.fn(),
    getIncomeExpense: jest.fn(),
    getByCategory: jest.fn(),
    getTrends: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return overview with stringified numeric fields', async () => {
      const userId = 'user-123';
      const overview = {
        totalIncome: 10000,
        totalExpense: 3000,
        netAmount: 7000,
        totalWallets: 2,
        totalBalance: 7000,
        transactionsCount: 5,
        incomeCount: 2,
        expenseCount: 3,
      };
      mockAnalyticsService.getOverview.mockResolvedValue(overview);

      const user = { id: userId };
      const result = await controller.getOverview(user);

      expect(result.totalIncome).toBe('10000');
      expect(result.totalExpense).toBe('3000');
      expect(result.netBalance).toBe('7000');
      expect(result.walletCount).toBe(2);
      expect(result.transactionCount).toBe(5);
      expect(service.getOverview).toHaveBeenCalledWith(userId);
    });
  });

  describe('getIncomeExpense', () => {
    it('should return income/expense data', async () => {
      const userId = 'user-123';
      const data = [
        { period: '2024-01-01', income: 1000, expense: 500, net: 500 },
      ];
      mockAnalyticsService.getIncomeExpense.mockResolvedValue(data);

      const user = { id: userId };
      const result = await controller.getIncomeExpense(user);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].period).toBe('2024-01-01');
      expect(result[0].income).toBe('1000');
      expect(result[0].expense).toBe('500');
      expect(result[0].net).toBe('500');
      expect(service.getIncomeExpense).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
        'day',
      );
    });
  });

  describe('getByCategory', () => {
    it('should return category stats', async () => {
      const userId = 'user-123';
      const categories = [
        {
          category: 'Food',
          totalAmount: 800,
          transactionCount: 4,
          type: TransactionType.EXPENSE,
          percentage: 40,
        },
      ];
      mockAnalyticsService.getByCategory.mockResolvedValue(categories);

      const user = { id: userId };
      const result = await controller.getByCategory(user);

      expect(result[0].category).toBe('Food');
      expect(result[0].total).toBe('800');
      expect(result[0].count).toBe(4);
      expect(service.getByCategory).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('getTrends', () => {
    it('should return error when startDate or endDate missing', async () => {
      const user = { id: 'user-123' };

      const result = await controller.getTrends(
        user,
        '' as any,
        '2024-01-31',
        'day',
      );

      expect(result).toEqual({
        error: 'startDate and endDate parameters are required',
      });
      expect(service.getTrends).not.toHaveBeenCalled();
    });

    it('should return trends when both dates provided', async () => {
      const userId = 'user-123';
      const trends = [
        { date: '2024-01-01', income: 1000, expense: 400, net: 600 },
      ];
      mockAnalyticsService.getTrends.mockResolvedValue(trends);

      const user = { id: userId };
      const result = await controller.getTrends(
        user,
        '2024-01-01',
        '2024-01-31',
        'day',
      );

      expect(result).toEqual(trends);
      expect(service.getTrends).toHaveBeenCalledWith(
        userId,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'day',
      );
    });
  });
});
