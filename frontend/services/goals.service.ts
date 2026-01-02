import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Goal,
  CreateGoalDto,
  UpdateGoalDto,
} from '../types';

export const goalsService = {
  /**
   * Получить список всех целей пользователя
   */
  async getAll(): Promise<Goal[]> {
    const response = await api.get<Goal[]>(API_ENDPOINTS.GOALS.BASE);
    return response.data;
  },

  /**
   * Получить цель по ID
   */
  async getById(id: string): Promise<Goal> {
    const response = await api.get<Goal>(API_ENDPOINTS.GOALS.BY_ID(id));
    return response.data;
  },

  /**
   * Создать новую цель
   */
  async create(data: CreateGoalDto): Promise<Goal> {
    const response = await api.post<Goal>(
      API_ENDPOINTS.GOALS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Обновить цель
   */
  async update(id: string, data: UpdateGoalDto): Promise<Goal> {
    const response = await api.patch<Goal>(
      API_ENDPOINTS.GOALS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Удалить цель
   */
  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.GOALS.BY_ID(id));
  },
};
