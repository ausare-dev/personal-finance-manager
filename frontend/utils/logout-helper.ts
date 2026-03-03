
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const triggerLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    if (logoutCallback) {
      logoutCallback();
    }
    
    window.location.href = '/login';
  }
};

