import { Test, TestingModule } from '@nestjs/testing';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';

describe('ImportExportController', () => {
  let controller: ImportExportController;
  let service: ImportExportService;

  const mockImportExportService = {
    importFromCsv: jest.fn(),
    importFromExcel: jest.fn(),
    exportToCsv: jest.fn(),
    exportToExcel: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImportExportController],
      providers: [
        {
          provide: ImportExportService,
          useValue: mockImportExportService,
        },
      ],
    }).compile();

    controller = module.get<ImportExportController>(ImportExportController);
    service = module.get<ImportExportService>(ImportExportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('importCsv', () => {
    it('should return error when file missing', async () => {
      const req = { body: {} } as any;
      const user = { id: 'user-123' };

      const result = await controller.importCsv(undefined as any, req, user);

      expect(result).toEqual({ error: 'File is required' });
      expect(service.importFromCsv).not.toHaveBeenCalled();
    });

    it('should return error when not CSV', async () => {
      const file = {
        mimetype: 'application/json',
        originalname: 'data.json',
        buffer: Buffer.from('[]'),
      } as Express.Multer.File;
      const req = { body: {} } as any;
      const user = { id: 'user-123' };

      const result = await controller.importCsv(file, req, user);

      expect(result).toEqual({ error: 'File must be a CSV file' });
      expect(service.importFromCsv).not.toHaveBeenCalled();
    });

    it('should call service with file, userId, walletId', async () => {
      const file = {
        mimetype: 'text/csv',
        originalname: 't.csv',
        buffer: Buffer.from('a,b\n1,2'),
      } as Express.Multer.File;
      const req = { body: { walletId: 'wallet-uuid' } } as any;
      const user = { id: 'user-123' };
      mockImportExportService.importFromCsv.mockResolvedValue({
        success: 0,
        failed: 0,
        errors: [],
      });

      await controller.importCsv(file, req, user);

      expect(service.importFromCsv).toHaveBeenCalledWith(
        file,
        'user-123',
        'wallet-uuid',
      );
    });
  });

  describe('importExcel', () => {
    it('should return error when file missing', async () => {
      const req = { body: {} } as any;
      const user = { id: 'user-123' };

      const result = await controller.importExcel(undefined as any, req, user);

      expect(result).toEqual({ error: 'File is required' });
      expect(service.importFromExcel).not.toHaveBeenCalled();
    });

    it('should return error when not Excel', async () => {
      const file = {
        mimetype: 'text/plain',
        originalname: 'data.txt',
        buffer: Buffer.from('x'),
      } as Express.Multer.File;
      const req = { body: {} } as any;
      const user = { id: 'user-123' };

      const result = await controller.importExcel(file, req, user);

      expect(result).toEqual({
        error: 'File must be an Excel file (.xlsx or .xls)',
      });
      expect(service.importFromExcel).not.toHaveBeenCalled();
    });

    it('should call service with file, userId, walletId', async () => {
      const file = {
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        originalname: 't.xlsx',
        buffer: Buffer.alloc(0),
      } as Express.Multer.File;
      const req = { body: { walletId: 'wallet-uuid' } } as any;
      const user = { id: 'user-123' };
      mockImportExportService.importFromExcel.mockResolvedValue({
        success: 0,
        failed: 0,
        errors: [],
      });

      await controller.importExcel(file, req, user);

      expect(service.importFromExcel).toHaveBeenCalledWith(
        file,
        'user-123',
        'wallet-uuid',
      );
    });
  });

  describe('exportCsv', () => {
    it('should call service and set res headers', async () => {
      const user = { id: 'user-123' };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;
      mockImportExportService.exportToCsv.mockResolvedValue('csv,content');

      await controller.exportCsv(user, res);

      expect(service.exportToCsv).toHaveBeenCalledWith(
        'user-123',
        undefined,
        undefined,
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=transactions.csv',
      );
      expect(res.send).toHaveBeenCalledWith('csv,content');
    });
  });

  describe('exportExcel', () => {
    it('should call service and set res headers', async () => {
      const user = { id: 'user-123' };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;
      const buf = Buffer.from('excel');
      mockImportExportService.exportToExcel.mockResolvedValue(buf);

      await controller.exportExcel(user, res);

      expect(service.exportToExcel).toHaveBeenCalledWith(
        'user-123',
        undefined,
        undefined,
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=transactions.xlsx',
      );
      expect(res.send).toHaveBeenCalledWith(buf);
    });
  });
});
