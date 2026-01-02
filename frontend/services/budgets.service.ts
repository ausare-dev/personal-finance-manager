import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Budget,
  CreateBudgetDto,
  UpdateBudgetDto,
} from '../types';

export const budgetsService = {
  /**
   * Получить список всех бюджетов пользователя
   */
  async getAll(): Promise<Budget[]> {
    const response = await api.get<Budget[]>(API_ENDPOINTS.BUDGETS.BASE);
    return response.data;
  },

  /**
   * Получить бюджет по ID
   */
  async getById(id: string): Promise<Budget> {
    const response = await api.get<Budget>(API_ENDPOINTS.BUDGETS.BY_ID(id));
    return response.data;
  },

  /**
   * Создать новый бюджет
   */
  async create(data: CreateBudgetDto): Promise<Budget> {
    const response = await api.post<Budget>(
      API_ENDPOINTS.BUDGETS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Обновить бюджет
   */
  async update(id: string, data: UpdateBudgetDto): Promise<Budget> {
    const response = await api.patch<Budget>(
      API_ENDPOINTS.BUDGETS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Удалить бюджет
   */
  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.BUDGETS.BY_ID(id));
  },
};
