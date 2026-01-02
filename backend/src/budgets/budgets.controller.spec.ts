import { Test, TestingModule } from '@nestjs/testing';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

describe('BudgetsController', () => {
  let controller: BudgetsController;
  let service: BudgetsService;

  const mockBudgetsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetsController],
      providers: [
        {
          provide: BudgetsService,
          useValue: mockBudgetsService,
        },
      ],
    }).compile();

    controller = module.get<BudgetsController>(BudgetsController);
    service = module.get<BudgetsService>(BudgetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of budgets', async () => {
      const userId = 'user-123';
      const mockBudgets = [
        {
          id: 'budget-1',
          userId,
          category: 'Food',
          limit: 1000,
        },
      ];

      mockBudgetsService.findAll.mockResolvedValue(mockBudgets);

      const user = { id: userId };
      const result = await controller.findAll(user);

      expect(result).toEqual(mockBudgets);
      expect(service.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('should create a new budget', async () => {
      const userId = 'user-123';
      const createBudgetDto: CreateBudgetDto = {
        category: 'Food',
        limit: 1000,
      };
      const mockBudget = {
        id: 'budget-1',
        userId,
        ...createBudgetDto,
      };

      mockBudgetsService.create.mockResolvedValue(mockBudget);

      const user = { id: userId };
      const result = await controller.create(createBudgetDto, user);

      expect(result).toEqual(mockBudget);
      expect(service.create).toHaveBeenCalledWith(createBudgetDto, userId);
    });
  });
});
