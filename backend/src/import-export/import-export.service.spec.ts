import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImportExportService } from './import-export.service';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

const validWalletId = '11111111-1111-4111-8111-111111111111';

describe('ImportExportService', () => {
  let service: ImportExportService;

  const mockTransactionRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockWalletsService = {};
  const mockTransactionsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportExportService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: WalletsService,
          useValue: mockWalletsService,
        },
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    service = module.get<ImportExportService>(ImportExportService);
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

  describe('importFromCsv', () => {
    const csv = (rows: string[]) =>
      Buffer.from(
        ['walletId,amount,type,category,description,date', ...rows].join('\n'),
        'utf-8',
      );

    it('should import valid rows with defaultWalletId and placeholder', async () => {
      const file = {
        buffer: csv([
          `WALLET_ID_HERE,100,expense,Food,Lunch,2024-01-15T12:00:00.000Z`,
        ]),
      } as Express.Multer.File;
      mockTransactionsService.create.mockResolvedValue({});

      const result = await service.importFromCsv(
        file,
        'user-123',
        validWalletId,
      );

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockTransactionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: validWalletId,
          amount: 100,
          type: TransactionType.EXPENSE,
          category: 'Food',
          description: 'Lunch',
        }),
        'user-123',
      );
    });

    it('should fail when placeholder without defaultWalletId', async () => {
      const file = {
        buffer: csv([
          `WALLET_ID_HERE,100,expense,Food,Lunch,2024-01-15T12:00:00.000Z`,
        ]),
      } as Express.Multer.File;

      const result = await service.importFromCsv(file, 'user-123');

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].message).toContain('ID кошелька обязателен');
    });

    it('should fail row when amount invalid', async () => {
      const file = {
        buffer: csv([
          `${validWalletId},abc,expense,Food,Lunch,2024-01-15T12:00:00.000Z`,
        ]),
      } as Express.Multer.File;

      const result = await service.importFromCsv(
        file,
        'user-123',
        validWalletId,
      );

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].message).toMatch(/сумма|number/i);
    });

    it('should fail row when type invalid', async () => {
      const file = {
        buffer: csv([
          `${validWalletId},100,invalid,Food,Lunch,2024-01-15T12:00:00.000Z`,
        ]),
      } as Express.Multer.File;

      const result = await service.importFromCsv(
        file,
        'user-123',
        validWalletId,
      );

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].message).toMatch(/тип|income|expense/i);
    });

    it('should fail row when category missing', async () => {
      const file = {
        buffer: csv([
          `${validWalletId},100,expense,,Lunch,2024-01-15T12:00:00.000Z`,
        ]),
      } as Express.Multer.File;

      const result = await service.importFromCsv(
        file,
        'user-123',
        validWalletId,
      );

      expect(result.success).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors[0].message).toMatch(/категор/i);
    });

    it('should throw on malformed CSV', async () => {
      const file = {
        buffer: Buffer.from('invalid\n"unclosed', 'utf-8'),
      } as Express.Multer.File;

      await expect(
        service.importFromCsv(file, 'user-123', validWalletId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('importFromExcel', () => {
    const createExcelBuffer = (rows: Record<string, unknown>[]) => {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    };

    it('should import valid rows with defaultWalletId and placeholder', async () => {
      const file = {
        buffer: createExcelBuffer([
          {
            walletId: 'WALLET_ID_HERE',
            amount: 200,
            type: 'income',
            category: 'Salary',
            description: 'Pay',
            date: '2024-01-15T12:00:00.000Z',
          },
        ]),
      } as Express.Multer.File;
      mockTransactionsService.create.mockResolvedValue({});

      const result = await service.importFromExcel(
        file,
        'user-123',
        validWalletId,
      );

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockTransactionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: validWalletId,
          amount: 200,
          type: TransactionType.INCOME,
          category: 'Salary',
        }),
        'user-123',
      );
    });
  });

  describe('exportToCsv', () => {
    it('should return CSV string', async () => {
      mockTransactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      const tx = {
        walletId: validWalletId,
        amount: 100,
        type: 'expense',
        category: 'Food',
        tags: [],
        description: 'Lunch',
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
      };
      mockQueryBuilder.getMany.mockResolvedValue([tx]);

      const result = await service.exportToCsv('user-123');

      expect(typeof result).toBe('string');
      expect(result).toContain('Wallet ID');
      expect(result).toContain('Amount');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'transaction.userId = :userId',
        { userId: 'user-123' },
      );
    });
  });

  describe('exportToExcel', () => {
    it('should return Excel buffer', async () => {
      mockTransactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.exportToExcel('user-123');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
