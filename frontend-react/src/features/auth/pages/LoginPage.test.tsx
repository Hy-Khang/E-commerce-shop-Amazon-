import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import LoginPage from './LoginPage';
import { renderWithProviders } from '../tests/mocks/auth.mock';

vi.mock('../hooks/useLogin', () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

describe('LoginPage', () => {
  it('should render page heading', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument();
  });

  it('should render login form', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
