import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Wallet,
  CreateWalletDto,
  UpdateWalletDto,
} from '../types';

export const walletsService = {
  /**
   * Получить список всех кошельков пользователя
   */
  async getAll(): Promise<Wallet[]> {
    const response = await api.get<Wallet[]>(API_ENDPOINTS.WALLETS.BASE);
    return response.data;
  },

  /**
   * Получить кошелек по ID
   */
  async getById(id: string): Promise<Wallet> {
    const response = await api.get<Wallet>(API_ENDPOINTS.WALLETS.BY_ID(id));
    return response.data;
  },

  /**
   * Создать новый кошелек
   */
  async create(data: CreateWalletDto): Promise<Wallet> {
    const response = await api.post<Wallet>(
      API_ENDPOINTS.WALLETS.BASE,
      data
    );
    return response.data;
  },

  /**
   * Обновить кошелек
   */
  async update(id: string, data: UpdateWalletDto): Promise<Wallet> {
    const response = await api.patch<Wallet>(
      API_ENDPOINTS.WALLETS.BY_ID(id),
      data
    );
    return response.data;
  },

  /**
   * Удалить кошелек
   */
  async delete(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.WALLETS.BY_ID(id));
  },
};
