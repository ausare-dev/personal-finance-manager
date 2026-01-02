import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Investment,
  CreateInvestmentDto,
  UpdateInvestmentDto,
} from '../types';

export interface PortfolioSummary {
  totalValue: string;
  totalCost: string;
  profitLoss: string;
  profitLossPercentage: number;
  investments: Investment[];
}

export const investmentsService = {
  /**
   * Получить список всех инвестиций пользователя
   */
  async getAll(): Promise<Investment[]> {
    const response = await api.get<Investment[]>(
      API_ENDPOINTS.INVESTMENTS.BASE
    );
    return response.data;
  },

  /**
   * Получить инвестицию по ID
   */
  async getById(id: string): Promise<Investment> {
    const response = await api.get<Investment>(
      API_ENDPOINTS.INVESTMENTS.BY_ID(id)
    );
    return response.data;
  },

  /**
   * Создать новую инвестицию
   */
  async create(data: CreateInvestmentDto): Promise<Investment> {
    const response = await api.post<Investment>(
      API_ENDPOINTS.INVESTMENTS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Обновить инвестицию
   */
  async update(
    id: string,
    data: UpdateInvestmentDto
  ): Promise<Investment> {
    const response = await api.patch<Investment>(
      API_ENDPOINTS.INVESTMENTS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Удалить инвестицию
   */
  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.INVESTMENTS.BY_ID(id));
  },

  /**
   * Получить сводку портфеля
   */
  async getPortfolio(): Promise<PortfolioSummary> {
    const response = await api.get<PortfolioSummary>(
      API_ENDPOINTS.INVESTMENTS.PORTFOLIO
    );
    return response.data;
  },
};

