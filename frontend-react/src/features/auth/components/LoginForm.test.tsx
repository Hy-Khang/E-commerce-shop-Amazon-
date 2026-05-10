import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';
import { renderWithProviders } from '../tests/mocks/auth.mock';
import { ApiError } from '@/core/api/api.types';

const mockMutate = vi.fn();
const mockLoginHook = {
  mutate: mockMutate,
  isPending: false,
  error: null as Error | null,
};

vi.mock('../hooks/useLogin', () => ({
  useLogin: () => mockLoginHook,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginHook.isPending = false;
    mockLoginHook.error = null;
  });

  it('should render email and password fields', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('should render link to register page', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  it('should not submit with invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await vi.waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('should not submit with short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await vi.waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('should call mutate with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await vi.waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      });
    });
  });

  it('should show pending state', () => {
    mockLoginHook.isPending = true;
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
  });

  it('should display ApiError message', () => {
    mockLoginHook.error = new ApiError('AUTH_001', 'Invalid credentials', 401);
    renderWithProviders(<LoginForm />);

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should display generic error for non-ApiError', () => {
    mockLoginHook.error = new Error('Network error');
    renderWithProviders(<LoginForm />);

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});
