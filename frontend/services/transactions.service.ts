import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  FilterTransactionDto,
} from '../types';

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export const transactionsService = {
  /**
   * Получить список транзакций с фильтрацией и пагинацией
   */
  async getAll(filters?: FilterTransactionDto): Promise<TransactionsResponse> {
    const response = await api.get<TransactionsResponse>(
      API_ENDPOINTS.TRANSACTIONS.BASE,
      { params: filters }
    );
    return response.data;
  },

  /**
   * Получить транзакцию по ID
   */
  async getById(id: string): Promise<Transaction> {
    const response = await api.get<Transaction>(
      API_ENDPOINTS.TRANSACTIONS.BY_ID(id)
    );
    return response.data;
  },

  /**
   * Создать новую транзакцию
   */
  async create(data: CreateTransactionDto): Promise<Transaction> {
    const response = await api.post<Transaction>(
      API_ENDPOINTS.TRANSACTIONS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Обновить транзакцию
   */
  async update(id: string, data: UpdateTransactionDto): Promise<Transaction> {
    const response = await api.patch<Transaction>(
      API_ENDPOINTS.TRANSACTIONS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Удалить транзакцию
   */
  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.TRANSACTIONS.BY_ID(id));
  },
};
