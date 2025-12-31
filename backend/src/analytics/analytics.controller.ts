import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransactionType } from '../entities/transaction.entity';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: { id: string }) {
    return this.analyticsService.getOverview(user.id);
  }

  @Get('income-expense')
  getIncomeExpense(
    @CurrentUser() user: { id: string },
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getIncomeExpense(user.id, start, end);
  }

  @Get('by-category')
  getByCategory(
    @CurrentUser() user: { id: string },
    @Query('type') type?: TransactionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getByCategory(user.id, type, start, end);
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

