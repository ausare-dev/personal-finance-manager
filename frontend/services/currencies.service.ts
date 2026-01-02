import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type { CurrencyRate } from '../types';

export interface ConvertCurrencyParams {
  amount: number;
  from: string;
  to: string;
}

export interface ConvertCurrencyResponse {
  amount: string;
  from: string;
  to: string;
  rate: string;
  result: string;
}

export const currenciesService = {
  /**
   * Получить все курсы валют
   */
  async getRates(): Promise<CurrencyRate[]> {
    const response = await api.get<CurrencyRate[]>(
      API_ENDPOINTS.CURRENCIES.RATES
    );
    return response.data;
  },

  /**
   * Получить курсы для базовой валюты
   */
  async getRatesByBase(base: string): Promise<CurrencyRate[]> {
    const response = await api.get<CurrencyRate[]>(
      `${API_ENDPOINTS.CURRENCIES.RATES}/${base}`
    );
    return response.data;
  },

  /**
   * Получить конкретный курс валют
   */
  async getRate(from: string, to: string): Promise<CurrencyRate> {
    const response = await api.get<CurrencyRate>(
      API_ENDPOINTS.CURRENCIES.RATE,
      {
        params: { from, to },
      }
    );
    return response.data;
  },

  /**
   * Конвертировать валюту
   */
  async convert(params: ConvertCurrencyParams): Promise<ConvertCurrencyResponse> {
    const response = await api.get<ConvertCurrencyResponse>(
      API_ENDPOINTS.CURRENCIES.CONVERT,
      {
        params,
      }
    );
    return response.data;
  },

  /**
   * Принудительно обновить курсы валют
   */
  async updateRates(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(
      API_ENDPOINTS.CURRENCIES.UPDATE
    );
    return response.data;
  },
};

