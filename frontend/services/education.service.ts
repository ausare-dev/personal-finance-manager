import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type {
  Article,
  CreateArticleDto,
  UpdateArticleDto,
} from '../types';

export const educationService = {
  async getAll(): Promise<Article[]> {
    const response = await api.get<Article[]>(
      API_ENDPOINTS.EDUCATION.ARTICLES
    );
    return response.data;
  },

  async getById(id: string): Promise<Article> {
    const response = await api.get<Article>(
      API_ENDPOINTS.EDUCATION.ARTICLE_BY_ID(id)
    );
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.get<string[]>(
      API_ENDPOINTS.EDUCATION.CATEGORIES
    );
    return response.data;
  },

  async createArticle(data: CreateArticleDto): Promise<Article> {
    const response = await api.post<Article>(
      API_ENDPOINTS.EDUCATION.ARTICLES,
      data
    );
    return response.data;
  },

  async updateArticle(id: string, data: UpdateArticleDto): Promise<Article> {
    const response = await api.patch<Article>(
      API_ENDPOINTS.EDUCATION.ARTICLE_BY_ID(id),
      data
    );
    return response.data;
  },

  async deleteArticle(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.EDUCATION.ARTICLE_BY_ID(id));
  },
};

