import { describe, it, expect } from 'vitest';
import {
  API_ENDPOINTS,
  STORAGE_KEYS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE,
} from '@/utils/constants';

describe('constants', () => {
  it('API_ENDPOINTS has AUTH, WALLETS, TRANSACTIONS, etc.', () => {
    expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
    expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    expect(API_ENDPOINTS.WALLETS.BASE).toBe('/wallets');
    expect(API_ENDPOINTS.WALLETS.BY_ID('x')).toBe('/wallets/x');
    expect(API_ENDPOINTS.TRANSACTIONS.BASE).toBe('/transactions');
    expect(API_ENDPOINTS.IMPORT_EXPORT.CSV).toBe('/import-export/csv');
    expect(API_ENDPOINTS.EDUCATION.ARTICLES).toBe('/education/articles');
  });

  it('STORAGE_KEYS has ACCESS_TOKEN and USER', () => {
    expect(STORAGE_KEYS.ACCESS_TOKEN).toBe('access_token');
    expect(STORAGE_KEYS.USER).toBe('user');
  });

  it('DEFAULT_PAGE_SIZE and DEFAULT_PAGE', () => {
    expect(DEFAULT_PAGE_SIZE).toBe(10);
    expect(DEFAULT_PAGE).toBe(1);
  });
});
