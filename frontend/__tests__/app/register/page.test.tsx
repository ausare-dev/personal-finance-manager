import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import RegisterPage from '@/app/register/page';

const mockPush = vi.fn();
const mockRegister = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/register',
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

function RegisterWrapper() {
  return (
    <App>
      <RegisterPage />
    </App>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with heading', () => {
    render(<RegisterWrapper />);
    expect(screen.getByRole('heading', { level: 2, name: /регистрация/i })).toBeInTheDocument();
  });

  it('renders email, password, confirm password inputs', () => {
    render(<RegisterWrapper />);
    expect(screen.getAllByPlaceholderText(/введите email/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText(/введите пароль/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText(/подтвердите пароль/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders register button and link to login', () => {
    render(<RegisterWrapper />);
    expect(screen.getAllByRole('button', { name: /зарегистрироваться/i }).length).toBeGreaterThanOrEqual(1);
    const loginLinks = screen.getAllByRole('link', { name: /войти/i });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });
});
