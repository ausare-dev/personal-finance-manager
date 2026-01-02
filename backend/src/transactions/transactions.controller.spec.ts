import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const userId = 'user-123';
      const mockResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockTransactionsService.findAll.mockResolvedValue(mockResponse);

      const user = { id: userId };
      const result = await controller.findAll({}, user);

      expect(result).toEqual(mockResponse);
      expect(service.findAll).toHaveBeenCalledWith(userId, {});
    });
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const userId = 'user-123';
      const createTransactionDto: CreateTransactionDto = {
        walletId: 'wallet-1',
        amount: 1000,
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString(),
      };
      const mockTransaction = {
        id: 'transaction-1',
        userId,
        ...createTransactionDto,
      };

      mockTransactionsService.create.mockResolvedValue(mockTransaction);

      const user = { id: userId };
      const result = await controller.create(createTransactionDto, user);

      expect(result).toEqual(mockTransaction);
      expect(service.create).toHaveBeenCalledWith(createTransactionDto, userId);
    });
  });
});
