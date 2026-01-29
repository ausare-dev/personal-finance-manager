import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvestmentsService } from './investments.service';
import { Investment } from '../entities/investment.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('InvestmentsService', () => {
  let service: InvestmentsService;
  let repository: Repository<Investment>;

  const purchaseDate = new Date('2024-01-15');

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        {
          provide: getRepositoryToken(Investment),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InvestmentsService>(InvestmentsService);
    repository = module.get<Repository<Investment>>(
      getRepositoryToken(Investment),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return investments with metrics for user', async () => {
      const userId = 'user-123';
      const mockInvestments: Investment[] = [
        {
          id: 'inv-1',
          userId,
          assetName: 'ETF',
          quantity: 10,
          purchasePrice: 100,
          currentPrice: 120,
          purchaseDate,
          createdAt: new Date(),
        } as Investment,
      ];

      mockRepository.find.mockResolvedValue(mockInvestments);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('totalValue', 1200);
      expect(result[0]).toHaveProperty('totalCost', 1000);
      expect(result[0]).toHaveProperty('profitLoss', 200);
      expect(result[0]).toHaveProperty('profitLossPercentage');
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { purchaseDate: 'DESC' },
      });
    });
  });

  describe('getPortfolio', () => {
    it('should return portfolio summary', async () => {
      const userId = 'user-123';
      const mockInvestments: Investment[] = [
        {
          id: 'inv-1',
          userId,
          assetName: 'ETF',
          quantity: 10,
          purchasePrice: 100,
          currentPrice: 120,
          purchaseDate,
          createdAt: new Date(),
        } as Investment,
      ];

      mockRepository.find.mockResolvedValue(mockInvestments);

      const result = await service.getPortfolio(userId);

      expect(result.totalInvestments).toBe(1);
      expect(result.totalValue).toBe(1200);
      expect(result.totalCost).toBe(1000);
      expect(result.totalProfitLoss).toBe(200);
      expect(result.investments).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return investment with metrics if found and belongs to user', async () => {
      const invId = 'inv-1';
      const userId = 'user-123';
      const mockInvestment: Investment = {
        id: invId,
        userId,
        assetName: 'ETF',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 120,
        purchaseDate,
        createdAt: new Date(),
      } as Investment;

      mockRepository.findOne.mockResolvedValue(mockInvestment);

      const result = await service.findOne(invId, userId);

      expect(result).toBeDefined();
      expect(result.totalValue).toBe(1200);
      expect(result.totalCost).toBe(1000);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: invId },
      });
    });

    it('should throw NotFoundException if investment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if investment belongs to different user', async () => {
      const mockInvestment: Investment = {
        id: 'inv-1',
        userId: 'other-user',
        assetName: 'ETF',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 120,
        purchaseDate,
        createdAt: new Date(),
      } as Investment;

      mockRepository.findOne.mockResolvedValue(mockInvestment);

      await expect(service.findOne('inv-1', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new investment', async () => {
      const userId = 'user-123';
      const createDto: CreateInvestmentDto = {
        assetName: 'Stock',
        quantity: 5,
        purchasePrice: 200,
        currentPrice: 210,
        purchaseDate: purchaseDate.toISOString(),
      };
      const mockInvestment: Investment = {
        id: 'inv-1',
        userId,
        ...createDto,
        purchaseDate,
        createdAt: new Date(),
      } as Investment;

      mockRepository.create.mockReturnValue(mockInvestment);
      mockRepository.save.mockResolvedValue(mockInvestment);

      const result = await service.create(createDto, userId);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createDto,
        userId,
        purchaseDate,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockInvestment);
    });
  });

  describe('update', () => {
    it('should update an investment', async () => {
      const invId = 'inv-1';
      const userId = 'user-123';
      const mockInvestment: Investment = {
        id: invId,
        userId,
        assetName: 'ETF',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 120,
        purchaseDate,
        createdAt: new Date(),
      } as Investment;
      const updateDto: UpdateInvestmentDto = { currentPrice: 130 };

      mockRepository.findOne.mockResolvedValue(mockInvestment);
      mockRepository.save.mockResolvedValue({
        ...mockInvestment,
        ...updateDto,
      });

      const result = await service.update(invId, updateDto, userId);

      expect(result).toBeDefined();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if investment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { assetName: 'X' }, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if investment belongs to different user', async () => {
      const mockInvestment: Investment = {
        id: 'inv-1',
        userId: 'other-user',
        assetName: 'ETF',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 120,
        purchaseDate,
        createdAt: new Date(),
      } as Investment;

      mockRepository.findOne.mockResolvedValue(mockInvestment);

      await expect(
        service.update('inv-1', { assetName: 'X' }, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove an investment', async () => {
      const invId = 'inv-1';
      const userId = 'user-123';
      const mockInvestment: Investment = {
        id: invId,
        userId,
        assetName: 'ETF',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 120,
        purchaseDate,
        createdAt: new Date(),
      } as Investment;

      mockRepository.findOne.mockResolvedValue(mockInvestment);
      mockRepository.remove.mockResolvedValue(mockInvestment);

      await service.remove(invId, userId);

      expect(mockRepository.remove).toHaveBeenCalledWith(mockInvestment);
    });

    it('should throw NotFoundException if investment not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if investment belongs to different user', async () => {
      const mockInvestment: Investment = {
        id: 'inv-1',
        userId: 'other-user',
        assetName: 'ETF',
        quantity: 10,
        purchasePrice: 100,
        currentPrice: 120,
        purchaseDate,
        createdAt: new Date(),
      } as Investment;

      mockRepository.findOne.mockResolvedValue(mockInvestment);

      await expect(service.remove('inv-1', 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
