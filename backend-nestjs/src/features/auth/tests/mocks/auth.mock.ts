import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';

export const mockRole = (overrides: Partial<Role> = {}): Role => ({
  id: 1,
  name: 'customer',
  is_system: false,
  users: [],
  role_permissions: [],
  ...overrides,
});

export const mockAdminRole = (overrides: Partial<Role> = {}): Role => ({
  id: 2,
  name: 'admin',
  is_system: false,
  users: [],
  role_permissions: [],
  ...overrides,
});

export const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: 'test@example.com',
  password_hash: '$2b$10$hashedpassword',
  full_name: 'Nguyen Van A',
  phone: '0901234567',
  is_active: true,
  email_verified: true,
  email_verify_token: null,
  email_verify_expires: null,
  email_verify_count: 0,
  email_verify_count_reset: null,
  email_verify_attempts: 0,
  password_reset_token_hash: null,
  password_reset_expires_at: null,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  role_id: 1,
  role: mockRole(),
  refresh_tokens: [],
  auth_providers: [],
  ...overrides,
});

export const mockUserWithStats = (
  overrides: Partial<User & { orderCount: number; reviewCount: number }> = {},
): User & { orderCount: number; reviewCount: number } => ({
  ...mockUser(),
  orderCount: 5,
  reviewCount: 3,
  ...overrides,
});

export const mockRoleWithUserCount = (
  overrides: Partial<Role & { userCount: number }> = {},
): Role & { userCount: number } => ({
  ...mockRole(),
  userCount: 10,
  ...overrides,
});

export const mockRefreshToken = (
  overrides: Partial<RefreshToken> = {},
): RefreshToken => ({
  id: 1,
  token_hash: 'hashed_token_value',
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  created_at: new Date('2026-01-01T00:00:00Z'),
  is_revoked: false,
  ip_address: null as any,
  user_agent: null as any,
  device_name: null as any,
  user_id: 1,
  user: mockUser(),
  ...overrides,
});
