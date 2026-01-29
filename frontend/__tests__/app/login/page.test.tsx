import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from 'antd';
import LoginPage from '@/app/login/page';

const mockPush = vi.fn();
const mockLogin = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/login',
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

function LoginWrapper() {
  return (
    <App>
      <LoginPage />
    </App>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form with heading and fields', () => {
    render(<LoginWrapper />);
    expect(screen.getByRole('heading', { level: 2, name: /вход в систему/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/введите email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/введите пароль/i)).toBeInTheDocument();
  });

  it('renders Войти and demo login buttons', () => {
    render(<LoginWrapper />);
    expect(screen.getAllByRole('button', { name: /^Войти$/ }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('button', { name: /войти в демо-режим/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('renders register link', () => {
    render(<LoginWrapper />);
    const links = screen.getAllByRole('link', { name: /зарегистрироваться/i });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute('href', '/register');
  });

  it('calls login and router.push on submit with valid data', async () => {
    mockLogin.mockResolvedValue({ user: { id: '1', email: 'a@b.com' }, access_token: 'x' });
    render(<LoginWrapper />);
    const emailInput = screen.getAllByPlaceholderText(/введите email/i)[0];
    const passwordInput = screen.getAllByPlaceholderText(/введите пароль/i)[0];
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(screen.getAllByRole('button', { name: /^Войти$/ })[0]);
    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('calls login with demo credentials on demo button click', async () => {
    mockLogin.mockResolvedValue({ user: { id: '1', email: 'demo@example.com' }, access_token: 'x' });
    render(<LoginWrapper />);
    await userEvent.click(screen.getAllByRole('button', { name: /войти в демо-режим/i })[0]);
    expect(mockLogin).toHaveBeenCalledWith({ email: 'demo@example.com', password: 'demo123' });
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
