import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUserListPage from './AdminUserListPage';
import { mockAdminUser, mockRoleWithUserCount, renderWithProviders } from '../tests/mocks/auth.mock';

const mockUsers = [
  mockAdminUser({ id: 1, full_name: 'Nguyen Van A', email: 'a@test.com', role: { id: 1, name: 'customer' }, is_active: true }),
  mockAdminUser({ id: 2, full_name: 'Tran Van B', email: 'b@test.com', role: { id: 2, name: 'admin' }, is_active: false }),
];
const mockMeta = { page: 1, limit: 20, total: 2, totalPages: 1 };
const mockRoles = [
  mockRoleWithUserCount({ id: 1, name: 'customer' }),
  mockRoleWithUserCount({ id: 2, name: 'admin' }),
];

const mockToggleMutate = vi.fn();

vi.mock('../hooks/useAdminUsers', () => ({
  useAdminUsers: () => ({
    data: { data: mockUsers, meta: mockMeta },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useAdminRoles', () => ({
  useAdminRoles: () => ({
    data: mockRoles,
  }),
}));

vi.mock('../hooks/useToggleActivate', () => ({
  useToggleActivate: () => ({
    mutate: mockToggleMutate,
    isPending: false,
  }),
}));

vi.mock('@/common/hooks/usePagination', () => ({
  usePagination: () => ({
    params: { page: 1, limit: 20 },
    setPage: vi.fn(),
    setSearchParams: vi.fn(),
  }),
}));

vi.mock('@/common/utils/format.util', () => ({
  formatDate: (date: string) => date,
}));

describe('AdminUserListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page heading', () => {
    renderWithProviders(<AdminUserListPage />);

    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });

  it('should render users in the table', () => {
    renderWithProviders(<AdminUserListPage />);

    expect(screen.getByText('Nguyen Van A')).toBeInTheDocument();
    expect(screen.getByText('a@test.com')).toBeInTheDocument();
    expect(screen.getByText('Tran Van B')).toBeInTheDocument();
    expect(screen.getByText('b@test.com')).toBeInTheDocument();
  });

  it('should render role badges', () => {
    renderWithProviders(<AdminUserListPage />);

    const customerTexts = screen.getAllByText('customer');
    expect(customerTexts.length).toBeGreaterThanOrEqual(1);
    const adminTexts = screen.getAllByText('admin');
    expect(adminTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('should render status badges', () => {
    renderWithProviders(<AdminUserListPage />);

    const activeTexts = screen.getAllByText('Active');
    expect(activeTexts.length).toBeGreaterThanOrEqual(1);
    const inactiveTexts = screen.getAllByText('Inactive');
    expect(inactiveTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('should render View links for each user', () => {
    renderWithProviders(<AdminUserListPage />);

    const viewLinks = screen.getAllByRole('link', { name: 'View user' });
    expect(viewLinks).toHaveLength(2);
    expect(viewLinks[0]).toHaveAttribute('href', '/admin/users/1');
    expect(viewLinks[1]).toHaveAttribute('href', '/admin/users/2');
  });

  it('should render Ban for active users and Unban for inactive', () => {
    renderWithProviders(<AdminUserListPage />);

    expect(screen.getByRole('button', { name: 'Ban user' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unban user' })).toBeInTheDocument();
  });

  it('should call toggle activate when Ban/Unban clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUserListPage />);

    await user.click(screen.getByRole('button', { name: 'Ban user' }));
    await user.click(screen.getByRole('button', { name: 'Ban Account' }));

    expect(mockToggleMutate).toHaveBeenCalledWith(1, expect.any(Object));
  });
});
