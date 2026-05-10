import { type ReactNode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { AuthUser, LoginResponse } from '../../types/auth.types';
import type {
  Role,
  RoleWithUserCount,
  AdminUser,
  AdminUserDetail,
} from '../../types/admin.types';

export function mockAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    email: 'user@example.com',
    full_name: 'Nguyen Van A',
    role: 'customer',
    ...overrides,
  };
}

export function mockLoginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: mockAuthUser(),
    ...overrides,
  };
}

export function mockRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 1,
    name: 'customer',
    ...overrides,
  };
}

export function mockRoleWithUserCount(overrides: Partial<RoleWithUserCount> = {}): RoleWithUserCount {
  return {
    id: 1,
    name: 'customer',
    userCount: 10,
    ...overrides,
  };
}

export function mockAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    email: 'user@example.com',
    full_name: 'Nguyen Van A',
    phone: '0901234567',
    is_active: true,
    role: { id: 1, name: 'customer' },
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function mockAdminUserDetail(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    ...mockAdminUser(),
    orderCount: 5,
    reviewCount: 3,
    ...overrides,
  };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactNode,
  { route = '/', queryClient }: { route?: string; queryClient?: QueryClient } = {},
) {
  const client = queryClient ?? createTestQueryClient();
  return {
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>,
    ),
    queryClient: client,
  };
}
