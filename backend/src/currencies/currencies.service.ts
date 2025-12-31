import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { CurrencyRate } from '../entities/currency-rate.entity';

@Injectable()
export class CurrenciesService implements OnModuleInit {
  private readonly logger = new Logger(CurrenciesService.name);
  private readonly exchangeRateApiUrl =
    'https://api.exchangerate-api.com/v4/latest';

  constructor(
    @InjectRepository(CurrencyRate)
    private currencyRateRepository: Repository<CurrencyRate>,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Обновить курсы при старте приложения
    await this.updateRates();
  }

  /**
   * Получить курс обмена валют
   * @param fromCurrency Базовая валюта (например, 'USD')
   * @param toCurrency Целевая валюта (например, 'RUB')
   * @returns Курс обмена или null, если курс не найден
   */
  async getRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number | null> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // Попытка найти прямой курс
    let rate = await this.findRate(fromCurrency, toCurrency);
    if (rate) {
      return parseFloat(rate.rate.toString());
    }

    // Попытка найти обратный курс
    rate = await this.findRate(toCurrency, fromCurrency);
    if (rate) {
      return 1 / parseFloat(rate.rate.toString());
    }

    // Попытка найти через USD как промежуточную валюту
    if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
      const fromToUsd = await this.findRate(fromCurrency, 'USD');
      const usdToTo = await this.findRate('USD', toCurrency);

      if (fromToUsd && usdToTo) {
        const fromToUsdRate = parseFloat(fromToUsd.rate.toString());
        const usdToToRate = parseFloat(usdToTo.rate.toString());
        return fromToUsdRate * usdToToRate;
      }
    }

    return null;
  }

  /**
   * Конвертировать сумму из одной валюты в другую
   * @param amount Сумма для конвертации
   * @param fromCurrency Исходная валюта
   * @param toCurrency Целевая валюта
   * @returns Конвертированная сумма или null, если курс не найден
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number | null> {
    const rate = await this.getRate(fromCurrency, toCurrency);
    if (rate === null) {
      return null;
    }
    return amount * rate;
  }

  /**
   * Получить все актуальные курсы валют
   */
  async getAllRates(): Promise<CurrencyRate[]> {
    return this.currencyRateRepository.find({
      order: { fromCurrency: 'ASC', toCurrency: 'ASC' },
    });
  }

  /**
   * Получить курсы для конкретной базовой валюты
   */
  async getRatesByBaseCurrency(
    baseCurrency: string,
  ): Promise<CurrencyRate[]> {
    return this.currencyRateRepository.find({
      where: { fromCurrency: baseCurrency.toUpperCase() },
      order: { toCurrency: 'ASC' },
    });
  }

  /**
   * Обновить курсы валют из внешнего API
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async updateRates(): Promise<void> {
    this.logger.log('Starting currency rates update...');

    try {
      // Список основных валют
      const baseCurrencies = ['USD', 'EUR', 'RUB'];

      for (const baseCurrency of baseCurrencies) {
        await this.updateRatesForBaseCurrency(baseCurrency);
      }

      this.logger.log('Currency rates updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update currency rates: ${error.message}`);
    }
  }

  /**
   * Обновить курсы для базовой валюты
   */
  private async updateRatesForBaseCurrency(
    baseCurrency: string,
  ): Promise<void> {
    try {
      const response = await axios.get(
        `${this.exchangeRateApiUrl}/${baseCurrency}`,
        {
          timeout: 10000,
        },
      );

      const rates = response.data.rates;
      const date = response.data.date;

      this.logger.log(
        `Updating rates for ${baseCurrency}, date: ${date}, count: ${Object.keys(rates).length}`,
      );

      // Сохранить курсы в БД
      for (const [targetCurrency, rate] of Object.entries(rates)) {
        // Пропустить саму базовую валюту
        if (targetCurrency === baseCurrency) {
          continue;
        }

        // Ограничиваем количество валют для оптимизации
        const supportedCurrencies = ['USD', 'EUR', 'RUB', 'GBP', 'JPY', 'CNY'];
        if (
          !supportedCurrencies.includes(targetCurrency) &&
          baseCurrency !== 'USD'
        ) {
          continue;
        }

        await this.saveOrUpdateRate(
          baseCurrency,
          targetCurrency,
          rate as number,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update rates for ${baseCurrency}: ${error.message}`,
      );
    }
  }

  /**
   * Сохранить или обновить курс валют
   */
  private async saveOrUpdateRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
  ): Promise<void> {
    const existingRate = await this.currencyRateRepository.findOne({
      where: {
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
      },
    });

    if (existingRate) {
      existingRate.rate = rate;
      await this.currencyRateRepository.save(existingRate);
    } else {
      const newRate = this.currencyRateRepository.create({
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        rate,
      });
      await this.currencyRateRepository.save(newRate);
    }
  }

  /**
   * Найти курс валют в БД
   */
  private async findRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<CurrencyRate | null> {
    return this.currencyRateRepository.findOne({
      where: {
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
      },
    });
  }

  /**
   * Принудительно обновить курсы (для тестирования или ручного обновления)
   */
  async forceUpdateRates(): Promise<void> {
    this.logger.log('Force updating currency rates...');
    await this.updateRates();
  }
}

