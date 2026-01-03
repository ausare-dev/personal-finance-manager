import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransactionType } from '../entities/transaction.entity';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@CurrentUser() user: { id: string }) {
    const overview = await this.analyticsService.getOverview(user.id);
    // Transform to match frontend expectations
    return {
      totalIncome: overview.totalIncome.toString(),
      totalExpense: overview.totalExpense.toString(),
      netBalance: overview.netAmount.toString(),
      walletCount: overview.totalWallets,
      transactionCount: overview.transactionsCount,
    };
  }

  @Get('income-expense')
  async getIncomeExpense(
    @CurrentUser() user: { id: string },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const data = await this.analyticsService.getIncomeExpense(user.id, start, end, groupBy);
    // Transform to match frontend expectations
    return data.map(item => ({
      period: item.period,
      income: item.income.toString(),
      expense: item.expense.toString(),
      net: item.net.toString(),
    }));
  }

  @Get('by-category')
  async getByCategory(
    @CurrentUser() user: { id: string },
    @Query('type') type?: TransactionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    const categories = await this.analyticsService.getByCategory(user.id, type, start, end);
    // Transform to match frontend expectations
    return categories.map(item => ({
      category: item.category,
      total: item.totalAmount.toString(),
      count: item.transactionCount,
    }));
  }

  @Get('trends')
  getTrends(
    @CurrentUser() user: { id: string },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'day' | 'week' | 'month' = 'day',
  ) {
    if (!startDate || !endDate) {
      return {
        error: 'startDate and endDate parameters are required',
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.analyticsService.getTrends(user.id, start, end, groupBy);
  }
}

