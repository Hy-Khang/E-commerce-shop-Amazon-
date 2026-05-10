import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';
import { renderWithProviders } from '../tests/mocks/auth.mock';
import { ApiError } from '@/core/api/api.types';

const mockMutate = vi.fn();
const mockRegisterHook = {
  mutate: mockMutate,
  isPending: false,
  error: null as Error | null,
};

vi.mock('../hooks/useRegister', () => ({
  useRegister: () => mockRegisterHook,
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterHook.isPending = false;
    mockRegisterHook.error = null;
  });

  it('should render all form fields', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
  });

  it('should render submit button and login link', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('should not submit with empty full name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await vi.waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('should not submit with password mismatch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('Full name'), 'Nguyen Van A');
    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'different123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await vi.waitFor(() => {
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  it('should call mutate with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText('Full name'), 'Nguyen Van A');
    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.type(screen.getByLabelText('Confirm password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await vi.waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        full_name: 'Nguyen Van A',
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
    });
  });

  it('should show pending state', () => {
    mockRegisterHook.isPending = true;
    renderWithProviders(<RegisterForm />);

    expect(screen.getByRole('button', { name: 'Creating account...' })).toBeDisabled();
  });

  it('should display ApiError message', () => {
    mockRegisterHook.error = new ApiError('USER_001', 'Email already exists', 409);
    renderWithProviders(<RegisterForm />);

    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('should display generic error for non-ApiError', () => {
    mockRegisterHook.error = new Error('Network error');
    renderWithProviders(<RegisterForm />);

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});
