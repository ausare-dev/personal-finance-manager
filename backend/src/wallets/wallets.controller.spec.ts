import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: WalletsService;

  const mockWalletsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        {
          provide: WalletsService,
          useValue: mockWalletsService,
        },
      ],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
    service = module.get<WalletsService>(WalletsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of wallets', async () => {
      const userId = 'user-123';
      const mockWallets = [
        {
          id: 'wallet-1',
          userId,
          name: 'Wallet 1',
          currency: 'RUB',
          balance: 1000,
        },
      ];

      mockWalletsService.findAll.mockResolvedValue(mockWallets);

      const user = { id: userId };
      const result = await controller.findAll(user);

      expect(result).toEqual(mockWallets);
      expect(service.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('create', () => {
    it('should create a new wallet', async () => {
      const userId = 'user-123';
      const createWalletDto: CreateWalletDto = {
        name: 'New Wallet',
        currency: 'RUB',
      };
      const mockWallet = {
        id: 'wallet-1',
        userId,
        ...createWalletDto,
        balance: 0,
      };

      mockWalletsService.create.mockResolvedValue(mockWallet);

      const user = { id: userId };
      const result = await controller.create(createWalletDto, user);

      expect(result).toEqual(mockWallet);
      expect(service.create).toHaveBeenCalledWith(createWalletDto, userId);
    });
  });

  describe('findOne', () => {
    it('should return a wallet', async () => {
      const walletId = 'wallet-1';
      const userId = 'user-123';
      const mockWallet = {
        id: walletId,
        userId,
        name: 'Test Wallet',
        currency: 'RUB',
        balance: 1000,
      };

      mockWalletsService.findOne.mockResolvedValue(mockWallet);

      const user = { id: userId };
      const result = await controller.findOne(walletId, user);

      expect(result).toEqual(mockWallet);
      expect(service.findOne).toHaveBeenCalledWith(walletId, userId);
    });
  });

  describe('update', () => {
    it('should update a wallet', async () => {
      const walletId = 'wallet-1';
      const userId = 'user-123';
      const updateWalletDto: UpdateWalletDto = {
        name: 'Updated Wallet',
      };
      const mockWallet = {
        id: walletId,
        userId,
        name: 'Updated Wallet',
        currency: 'RUB',
        balance: 1000,
      };

      mockWalletsService.update.mockResolvedValue(mockWallet);

      const user = { id: userId };
      const result = await controller.update(walletId, updateWalletDto, user);

      expect(result).toEqual(mockWallet);
      expect(service.update).toHaveBeenCalledWith(
        walletId,
        updateWalletDto,
        userId,
      );
    });
  });

  describe('remove', () => {
    it('should delete a wallet', async () => {
      const walletId = 'wallet-1';
      const userId = 'user-123';
      const user = { id: userId };

      mockWalletsService.remove.mockResolvedValue(undefined);

      await controller.remove(walletId, user);

      expect(service.remove).toHaveBeenCalledWith(walletId, userId);
    });
  });
});
