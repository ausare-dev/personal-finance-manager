/**
 * Вспомогательная функция для логирования выхода из системы
 * Используется в axios interceptor для синхронизации состояния
 */

let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const triggerLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    // Вызываем callback если он установлен (для обновления состояния в контексте)
    if (logoutCallback) {
      logoutCallback();
    }
    
    // Редирект на страницу входа
    window.location.href = '/login';
  }
};

