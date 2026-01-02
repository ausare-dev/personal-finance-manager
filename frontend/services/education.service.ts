import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type { Article } from '../types';

export const educationService = {
  /**
   * Получить список всех статей
   */
  async getAll(): Promise<Article[]> {
    const response = await api.get<Article[]>(
      API_ENDPOINTS.EDUCATION.ARTICLES
    );
    return response.data;
  },

  /**
   * Получить статью по ID
   */
  async getById(id: string): Promise<Article> {
    const response = await api.get<Article>(
      API_ENDPOINTS.EDUCATION.ARTICLE_BY_ID(id)
    );
    return response.data;
  },

  /**
   * Получить список категорий статей
   */
  async getCategories(): Promise<string[]> {
    const response = await api.get<string[]>(
      API_ENDPOINTS.EDUCATION.CATEGORIES
    );
    return response.data;
  },
};

