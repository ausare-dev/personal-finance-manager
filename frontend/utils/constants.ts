// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
  },
  WALLETS: {
    BASE: '/wallets',
    BY_ID: (id: string) => `/wallets/${id}`,
  },
  TRANSACTIONS: {
    BASE: '/transactions',
    BY_ID: (id: string) => `/transactions/${id}`,
  },
  BUDGETS: {
    BASE: '/budgets',
    BY_ID: (id: string) => `/budgets/${id}`,
  },
  GOALS: {
    BASE: '/goals',
    BY_ID: (id: string) => `/goals/${id}`,
  },
  INVESTMENTS: {
    BASE: '/investments',
    BY_ID: (id: string) => `/investments/${id}`,
    PORTFOLIO: '/investments/portfolio',
  },
  CURRENCIES: {
    RATES: '/currencies/rates',
    RATE: '/currencies/rate',
    CONVERT: '/currencies/convert',
    UPDATE: '/currencies/update',
  },
  ANALYTICS: {
    OVERVIEW: '/analytics/overview',
    INCOME_EXPENSE: '/analytics/income-expense',
    BY_CATEGORY: '/analytics/by-category',
    TRENDS: '/analytics/trends',
  },
  IMPORT_EXPORT: {
    CSV: '/import-export/csv',
    EXCEL: '/import-export/excel',
  },
  EDUCATION: {
    ARTICLES: '/education/articles',
    ARTICLE_BY_ID: (id: string) => `/education/articles/${id}`,
    CATEGORIES: '/education/categories',
  },
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER: 'user',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

