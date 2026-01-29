import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { CurrenciesService } from './currencies.service';
import { CurrencyRate } from '../entities/currency-rate.entity';

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: { rates: {}, date: '2024-01-01' },
  }),
}));

describe('CurrenciesService', () => {
  let service: CurrenciesService;
  let repository: Repository<CurrencyRate>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        {
          provide: getRepositoryToken(CurrencyRate),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CurrenciesService>(CurrenciesService);
    repository = module.get<Repository<CurrencyRate>>(
      getRepositoryToken(CurrencyRate),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRate', () => {
    it('should return 1 for same currency', async () => {
      const result = await service.getRate('USD', 'USD');
      expect(result).toBe(1);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should return direct rate when found', async () => {
      mockRepository.findOne.mockResolvedValue({
        fromCurrency: 'USD',
        toCurrency: 'RUB',
        rate: 90,
      });

      const result = await service.getRate('USD', 'RUB');
      expect(result).toBe(90);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { fromCurrency: 'USD', toCurrency: 'RUB' },
      });
    });

    it('should return inverse rate when reverse pair found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        fromCurrency: 'RUB',
        toCurrency: 'USD',
        rate: 0.011,
      });

      const result = await service.getRate('USD', 'RUB');
      expect(result).toBe(1 / 0.011);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should return null when rate not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getRate('USD', 'XXX');
      expect(result).toBeNull();
    });
  });

  describe('convert', () => {
    it('should convert amount using rate', async () => {
      mockRepository.findOne.mockResolvedValue({
        fromCurrency: 'USD',
        toCurrency: 'RUB',
        rate: 90,
      });

      const result = await service.convert(100, 'USD', 'RUB');
      expect(result).toBe(9000);
    });

    it('should return null when rate not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.convert(100, 'USD', 'XXX');
      expect(result).toBeNull();
    });
  });

  describe('getAllRates', () => {
    it('should return all rates ordered', async () => {
      const rates: Partial<CurrencyRate>[] = [
        { fromCurrency: 'EUR', toCurrency: 'RUB', rate: 100 },
        { fromCurrency: 'USD', toCurrency: 'RUB', rate: 90 },
      ];
      mockRepository.find.mockResolvedValue(rates);

      const result = await service.getAllRates();
      expect(result).toEqual(rates);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { fromCurrency: 'ASC', toCurrency: 'ASC' },
      });
    });
  });

  describe('getRatesByBaseCurrency', () => {
    it('should return rates for base currency', async () => {
      const rates: Partial<CurrencyRate>[] = [
        { fromCurrency: 'USD', toCurrency: 'RUB', rate: 90 },
        { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
      ];
      mockRepository.find.mockResolvedValue(rates);

      const result = await service.getRatesByBaseCurrency('usd');
      expect(result).toEqual(rates);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { fromCurrency: 'USD' },
        order: { toCurrency: 'ASC' },
      });
    });
  });
});
