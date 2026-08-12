import { Address } from '../../entities/address.entity';
import { IUserProfileResponse } from '../../types/user-profile.types';

export const mockAddress = (overrides: Partial<Address> = {}): Address => ({
  id: 1,
  user_id: 1,
  full_name: 'Nguyen Van A',
  phone: '0901234567',
  address_line: '123 Le Loi, Quan 1',
  city: 'Ho Chi Minh',
  latitude: null,
  longitude: null,
  is_default: false,
  user: {} as any,
  ...overrides,
});

export const mockDefaultAddress = (overrides: Partial<Address> = {}): Address =>
  mockAddress({ id: 2, is_default: true, ...overrides });

export const mockUserProfile = (
  overrides: Partial<IUserProfileResponse> = {},
): IUserProfileResponse => ({
  id: 1,
  email: 'test@example.com',
  full_name: 'Nguyen Van A',
  phone: '0901234567',
  is_active: true,
  created_at: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});
