import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setLogoutCallback, triggerLogout } from '@/utils/logout-helper';

describe('logout-helper', () => {
  const removeItem = vi.fn();
  const mockLocation = { href: '', assign: vi.fn() };

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      removeItem,
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    mockLocation.href = '';
    Object.defineProperty(window, 'location', { value: mockLocation, writable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    removeItem.mockClear();
    setLogoutCallback(() => {});
  });

  it('setLogoutCallback stores callback', () => {
    const cb = vi.fn();
    setLogoutCallback(cb);
    triggerLogout();
    expect(cb).toHaveBeenCalled();
  });

  it('triggerLogout removes access_token and user from localStorage', () => {
    setLogoutCallback(() => {});
    triggerLogout();
    expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('triggerLogout redirects to /login', () => {
    setLogoutCallback(() => {});
    triggerLogout();
    expect(window.location.href).toBe('/login');
  });

  it('triggerLogout calls callback when set', () => {
    const cb = vi.fn();
    setLogoutCallback(cb);
    triggerLogout();
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
