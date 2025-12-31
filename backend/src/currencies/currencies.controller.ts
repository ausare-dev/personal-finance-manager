import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Public()
  @Get('rates')
  async getAllRates() {
    return this.currenciesService.getAllRates();
  }

  @Public()
  @Get('rates/:base')
  async getRatesByBase(@Param('base') base: string) {
    return this.currenciesService.getRatesByBaseCurrency(base);
  }

  @Public()
  @Get('rate')
  async getRate(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      return {
        error: 'Both "from" and "to" parameters are required',
      };
    }

    const rate = await this.currenciesService.getRate(from, to);
    if (rate === null) {
      return {
        error: `Exchange rate from ${from} to ${to} not found`,
      };
    }

    return {
      from,
      to,
      rate,
    };
  }

  @Public()
  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!amount || !from || !to) {
      return {
        error: 'Parameters "amount", "from", and "to" are required',
      };
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      return {
        error: 'Invalid amount value',
      };
    }

    const converted = await this.currenciesService.convert(
      numericAmount,
      from,
      to,
    );

    if (converted === null) {
      return {
        error: `Cannot convert from ${from} to ${to}`,
      };
    }

    return {
      from,
      to,
      amount: numericAmount,
      converted: Math.round(converted * 100) / 100,
    };
  }

  @Public()
  @Post('update')
  async forceUpdate() {
    await this.currenciesService.forceUpdateRates();
    return {
      message: 'Currency rates update started',
    };
  }
}

