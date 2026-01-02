import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletsService } from './wallets.service';
import { Wallet } from '../entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  let repository: Repository<Wallet>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    repository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of wallets for a user', async () => {
      const userId = 'user-123';
      const mockWallets: Wallet[] = [
        {
          id: 'wallet-1',
          userId,
          name: 'Wallet 1',
          currency: 'RUB',
          balance: 1000,
          createdAt: new Date(),
        } as Wallet,
      ];

      mockRepository.find.mockResolvedValue(mockWallets);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockWallets);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a wallet if found and belongs to user', async () => {
      const walletId = 'wallet-1';
      const userId = 'user-123';
      const mockWallet: Wallet = {
        id: walletId,
        userId,
        name: 'Test Wallet',
        currency: 'RUB',
        balance: 1000,
        createdAt: new Date(),
      } as Wallet;

      mockRepository.findOne.mockResolvedValue(mockWallet);

      const result = await service.findOne(walletId, userId);

      expect(result).toEqual(mockWallet);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: walletId },
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      const walletId = 'non-existent';
      const userId = 'user-123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(walletId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if wallet belongs to different user', async () => {
      const walletId = 'wallet-1';
      const userId = 'user-123';
      const differentUserId = 'user-456';
      const mockWallet: Wallet = {
        id: walletId,
        userId: differentUserId,
        name: 'Test Wallet',
        currency: 'RUB',
        balance: 1000,
        createdAt: new Date(),
      } as Wallet;

      mockRepository.findOne.mockResolvedValue(mockWallet);

      await expect(service.findOne(walletId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new wallet', async () => {
      const userId = 'user-123';
      const createWalletDto: CreateWalletDto = {
        name: 'New Wallet',
        currency: 'RUB',
      };
      const mockWallet: Wallet = {
        id: 'wallet-1',
        userId,
        ...createWalletDto,
        balance: 0,
        createdAt: new Date(),
      } as Wallet;

      mockRepository.create.mockReturnValue(mockWallet);
      mockRepository.save.mockResolvedValue(mockWallet);

      const result = await service.create(createWalletDto, userId);

      expect(result).toEqual(mockWallet);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createWalletDto,
        userId,
        currency: createWalletDto.currency || 'RUB',
        balance: 0,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockWallet);
    });

    it('should use RUB as default currency if not provided', async () => {
      const userId = 'user-123';
      const createWalletDto: CreateWalletDto = {
        name: 'New Wallet',
      };
      const mockWallet: Wallet = {
        id: 'wallet-1',
        userId,
        name: 'New Wallet',
        currency: 'RUB',
        balance: 0,
        createdAt: new Date(),
      } as Wallet;

      mockRepository.create.mockReturnValue(mockWallet);
      mockRepository.save.mockResolvedValue(mockWallet);

      await service.create(createWalletDto, userId);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createWalletDto,
        userId,
        currency: 'RUB',
        balance: 0,
      });
    });
  });

  describe('updateBalance', () => {
    it('should update wallet balance', async () => {
      const walletId = 'wallet-1';
      const newBalance = 2000;

      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateBalance(walletId, newBalance);

      expect(mockRepository.update).toHaveBeenCalledWith(walletId, {
        balance: newBalance,
      });
    });
  });
});
