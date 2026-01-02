import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  AnalyticsOverview,
  IncomeExpenseData,
  CategoryData,
  TrendData,
} from '../types';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export const analyticsService = {
  /**
   * Получить общую статистику
   */
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await api.get<AnalyticsOverview>(
      API_ENDPOINTS.ANALYTICS.OVERVIEW
    );
    return response.data;
  },

  /**
   * Получить статистику доходов и расходов за период
   */
  async getIncomeExpense(
    filters?: AnalyticsFilters
  ): Promise<IncomeExpenseData[]> {
    const response = await api.get<IncomeExpenseData[]>(
      API_ENDPOINTS.ANALYTICS.INCOME_EXPENSE,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Получить статистику по категориям
   */
  async getByCategory(
    filters?: AnalyticsFilters
  ): Promise<CategoryData[]> {
    const response = await api.get<CategoryData[]>(
      API_ENDPOINTS.ANALYTICS.BY_CATEGORY,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Получить тренды доходов/расходов
   */
  async getTrends(
    filters?: AnalyticsFilters
  ): Promise<TrendData[]> {
    const response = await api.get<TrendData[]>(
      API_ENDPOINTS.ANALYTICS.TRENDS,
      { params: filters }
    );
    return response.data;
  },
};

