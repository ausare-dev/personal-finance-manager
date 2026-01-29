import { Test, TestingModule } from '@nestjs/testing';
import { InvestmentsController } from './investments.controller';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';

describe('InvestmentsController', () => {
  let controller: InvestmentsController;
  let service: InvestmentsService;

  const mockInvestmentsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getPortfolio: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvestmentsController],
      providers: [
        {
          provide: InvestmentsService,
          useValue: mockInvestmentsService,
        },
      ],
    }).compile();

    controller = module.get<InvestmentsController>(InvestmentsController);
    service = module.get<InvestmentsService>(InvestmentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of investments', async () => {
      const userId = 'user-123';
      const mockInvestments = [
        {
          id: 'inv-1',
          userId,
          assetName: 'ETF',
          quantity: 10,
          totalValue: 1200,
          totalCost: 1000,
          profitLoss: 200,
        },
      ];

      mockInvestmentsService.findAll.mockResolvedValue(mockInvestments);

      const user = { id: userId };
      const result = await controller.findAll(user);

      expect(result).toEqual(mockInvestments);
      expect(service.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('getPortfolio', () => {
    it('should return portfolio with stringified numeric fields', async () => {
      const userId = 'user-123';
      const portfolio = {
        totalValue: 1200,
        totalCost: 1000,
        totalProfitLoss: 200,
        totalProfitLossPercentage: 20,
        investments: [],
      };

      mockInvestmentsService.getPortfolio.mockResolvedValue(portfolio);

      const user = { id: userId };
      const result = await controller.getPortfolio(user);

      expect(result.totalValue).toBe('1200');
      expect(result.totalCost).toBe('1000');
      expect(result.profitLoss).toBe('200');
      expect(result.profitLossPercentage).toBe(20);
      expect(result.investments).toEqual([]);
      expect(service.getPortfolio).toHaveBeenCalledWith(userId);
    });
  });

  describe('findOne', () => {
    it('should return an investment by id', async () => {
      const invId = 'inv-1';
      const userId = 'user-123';
      const mockInvestment = {
        id: invId,
        userId,
        assetName: 'ETF',
        totalValue: 1200,
      };

      mockInvestmentsService.findOne.mockResolvedValue(mockInvestment);

      const user = { id: userId };
      const result = await controller.findOne(invId, user);

      expect(result).toEqual(mockInvestment);
      expect(service.findOne).toHaveBeenCalledWith(invId, userId);
    });
  });

  describe('create', () => {
    it('should create a new investment', async () => {
      const userId = 'user-123';
      const createDto: CreateInvestmentDto = {
        assetName: 'Stock',
        quantity: 5,
        purchasePrice: 200,
        currentPrice: 210,
        purchaseDate: '2024-01-15',
      };
      const mockInvestment = { id: 'inv-1', userId, ...createDto };

      mockInvestmentsService.create.mockResolvedValue(mockInvestment);

      const user = { id: userId };
      const result = await controller.create(createDto, user);

      expect(result).toEqual(mockInvestment);
      expect(service.create).toHaveBeenCalledWith(createDto, userId);
    });
  });

  describe('update', () => {
    it('should update an investment', async () => {
      const invId = 'inv-1';
      const userId = 'user-123';
      const updateDto: UpdateInvestmentDto = { currentPrice: 130 };
      const mockInvestment = { id: invId, userId, currentPrice: 130 };

      mockInvestmentsService.update.mockResolvedValue(mockInvestment);

      const user = { id: userId };
      const result = await controller.update(invId, updateDto, user);

      expect(result).toEqual(mockInvestment);
      expect(service.update).toHaveBeenCalledWith(invId, updateDto, userId);
    });
  });

  describe('remove', () => {
    it('should remove an investment', async () => {
      const invId = 'inv-1';
      const userId = 'user-123';

      mockInvestmentsService.remove.mockResolvedValue(undefined);

      const user = { id: userId };
      await controller.remove(invId, user);

      expect(service.remove).toHaveBeenCalledWith(invId, userId);
    });
  });
});
