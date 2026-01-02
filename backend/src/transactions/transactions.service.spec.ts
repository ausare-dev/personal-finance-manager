import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repository: Repository<Transaction>;
  let walletsService: WalletsService;

  const mockRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockWalletsService = {
    findOne: jest.fn(),
    updateBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockRepository,
        },
        {
          provide: WalletsService,
          useValue: mockWalletsService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    repository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    walletsService = module.get<WalletsService>(WalletsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a transaction if found and belongs to user', async () => {
      const transactionId = 'transaction-1';
      const userId = 'user-123';
      const mockTransaction: Transaction = {
        id: transactionId,
        userId,
        walletId: 'wallet-1',
        amount: 1000,
        type: TransactionType.EXPENSE,
        category: 'Food',
        date: new Date(),
        createdAt: new Date(),
      } as Transaction;

      mockRepository.findOne.mockResolvedValue(mockTransaction);

      const result = await service.findOne(transactionId, userId);

      expect(result).toEqual(mockTransaction);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionId },
        relations: ['wallet'],
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      const transactionId = 'non-existent';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(transactionId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if transaction belongs to different user', async () => {
      const transactionId = 'transaction-1';
      const userId = 'user-123';
      const differentUserId = 'user-456';
      const mockTransaction: Transaction = {
        id: transactionId,
        userId: differentUserId,
        walletId: 'wallet-1',
        amount: 1000,
        type: TransactionType.EXPENSE,
        category: 'Food',
        date: new Date(),
        createdAt: new Date(),
      } as Transaction;

      mockRepository.findOne.mockResolvedValue(mockTransaction);

      await expect(service.findOne(transactionId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
