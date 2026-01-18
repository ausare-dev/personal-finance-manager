import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import type { UserProfile, UpdateEmailDto, UpdatePasswordDto } from '../types';

export const profileService = {
  /**
   * Получить профиль пользователя
   */
  async getProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>(API_ENDPOINTS.PROFILE.BASE);
    return response.data;
  },

  /**
   * Обновить email пользователя
   */
  async updateEmail(data: UpdateEmailDto): Promise<UserProfile> {
    const response = await api.patch<{ message: string; user: UserProfile }>(
      API_ENDPOINTS.PROFILE.BASE,
      data
    );
    // Обновляем пользователя в localStorage
    if (typeof window !== 'undefined' && response.data.user) {
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        user.email = response.data.user.email;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
    return response.data.user;
  },

  /**
   * Изменить пароль пользователя
   */
  async updatePassword(data: UpdatePasswordDto): Promise<void> {
    await api.patch(API_ENDPOINTS.PROFILE.PASSWORD, data);
  },
};