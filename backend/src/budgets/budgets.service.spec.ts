import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetsService } from './budgets.service';
import { Budget, BudgetPeriod } from '../entities/budget.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let repository: Repository<Budget>;
  let transactionsService: TransactionsService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockTransactionsService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: getRepositoryToken(Budget),
          useValue: mockRepository,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    repository = module.get<Repository<Budget>>(getRepositoryToken(Budget));
    transactionsService = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a budget if found and belongs to user', async () => {
      const budgetId = 'budget-1';
      const userId = 'user-123';
      const mockBudget: Budget = {
        id: budgetId,
        userId,
        category: 'Food',
        limit: 1000,
        period: BudgetPeriod.MONTHLY,
        createdAt: new Date(),
      } as Budget;

      mockRepository.findOne.mockResolvedValue(mockBudget);
      mockTransactionsService.findAll.mockResolvedValue({ data: [] });

      const result = await service.findOne(budgetId, userId);

      expect(result).toBeDefined();
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: budgetId },
      });
    });

    it('should throw NotFoundException if budget not found', async () => {
      const budgetId = 'non-existent';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(budgetId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if budget belongs to different user', async () => {
      const budgetId = 'budget-1';
      const userId = 'user-123';
      const differentUserId = 'user-456';
      const mockBudget: Budget = {
        id: budgetId,
        userId: differentUserId,
        category: 'Food',
        limit: 1000,
        period: BudgetPeriod.MONTHLY,
        createdAt: new Date(),
      } as Budget;

      mockRepository.findOne.mockResolvedValue(mockBudget);

      await expect(service.findOne(budgetId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new budget', async () => {
      const userId = 'user-123';
      const createBudgetDto: CreateBudgetDto = {
        category: 'Food',
        limit: 1000,
        period: BudgetPeriod.MONTHLY,
      };
      const mockBudget: Budget = {
        id: 'budget-1',
        userId,
        ...createBudgetDto,
        createdAt: new Date(),
      } as Budget;

      mockRepository.create.mockReturnValue(mockBudget);
      mockRepository.save.mockResolvedValue(mockBudget);
      mockTransactionsService.findAll.mockResolvedValue({ data: [] });

      const result = await service.create(createBudgetDto, userId);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
