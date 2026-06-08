import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUserDetailPage from './AdminUserDetailPage';
import { mockAdminUserDetail, mockRoleWithUserCount, renderWithProviders } from '../tests/mocks/auth.mock';

const mockUser = mockAdminUserDetail({
  id: 5,
  full_name: 'Nguyen Van A',
  email: 'a@test.com',
  phone: '0901234567',
  is_active: true,
  role: { id: 1, name: 'customer' },
  orderCount: 12,
  reviewCount: 4,
});

const mockRoles = [
  mockRoleWithUserCount({ id: 1, name: 'customer' }),
  mockRoleWithUserCount({ id: 2, name: 'admin' }),
];

const mockToggleMutate = vi.fn();
const mockChangeRoleMutate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '5' }),
  };
});

vi.mock('../hooks/useAdminUser', () => ({
  useAdminUser: () => ({
    data: mockUser,
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

vi.mock('../hooks/useChangeUserRole', () => ({
  useChangeUserRole: () => ({
    mutate: mockChangeRoleMutate,
    isPending: false,
  }),
}));

vi.mock('@/common/utils/format.util', () => ({
  formatDate: (date: string) => date,
}));

describe('AdminUserDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user name and email', () => {
    renderWithProviders(<AdminUserDetailPage />);

    expect(screen.getByRole('heading', { name: 'Nguyen Van A' })).toBeInTheDocument();
    const emails = screen.getAllByText('a@test.com');
    expect(emails.length).toBeGreaterThanOrEqual(1);
  });

  it('should render back link to users list', () => {
    renderWithProviders(<AdminUserDetailPage />);

    const backLink = screen.getByRole('link', { name: /Back to Users/i });
    expect(backLink).toHaveAttribute('href', '/admin/users');
  });

  it('should render profile details', () => {
    renderWithProviders(<AdminUserDetailPage />);

    expect(screen.getByText('0901234567')).toBeInTheDocument();
  });

  it('should render statistics', () => {
    renderWithProviders(<AdminUserDetailPage />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    renderWithProviders(<AdminUserDetailPage />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render role select with current role selected', () => {
    renderWithProviders(<AdminUserDetailPage />);

    const select = screen.getByLabelText('Role') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });

  it('should call changeRole when role is changed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUserDetailPage />);

    const select = screen.getByLabelText('Role');
    await user.selectOptions(select, '2');
    await user.click(screen.getByRole('button', { name: 'Change Role' }));

    expect(mockChangeRoleMutate).toHaveBeenCalledWith(
      {
        id: 5,
        data: { role_id: 2 },
      },
      expect.any(Object)
    );
  });

  it('should render Ban User button for active user', () => {
    renderWithProviders(<AdminUserDetailPage />);

    expect(screen.getByRole('button', { name: 'Ban User' })).toBeInTheDocument();
  });

  it('should call toggle activate when ban button clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminUserDetailPage />);

    await user.click(screen.getByRole('button', { name: 'Ban User' }));
    await user.click(screen.getByRole('button', { name: 'Ban Account' }));

    expect(mockToggleMutate).toHaveBeenCalledWith(5, expect.any(Object));
  });
});

