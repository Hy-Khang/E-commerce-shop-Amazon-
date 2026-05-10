import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminRoleListPage from './AdminRoleListPage';
import { mockRoleWithUserCount, renderWithProviders } from '../tests/mocks/auth.mock';
import type { RoleWithUserCount } from '../types/admin.types';

const mockRoles: RoleWithUserCount[] = [
  mockRoleWithUserCount({ id: 1, name: 'customer', userCount: 10 }),
  mockRoleWithUserCount({ id: 2, name: 'admin', userCount: 2 }),
];

const mockCreateMutate = vi.fn();
const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('../hooks/useAdminRoles', () => ({
  useAdminRoles: () => ({
    data: mockRoles,
    isLoading: false,
  }),
  useCreateRole: () => ({
    mutate: mockCreateMutate,
    isPending: false,
    error: null,
  }),
  useUpdateRole: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
    error: null,
  }),
  useDeleteRole: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

describe('AdminRoleListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page heading and create button', () => {
    renderWithProviders(<AdminRoleListPage />);

    expect(screen.getByRole('heading', { name: 'Roles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Role' })).toBeInTheDocument();
  });

  it('should render roles table with data', () => {
    renderWithProviders(<AdminRoleListPage />);

    expect(screen.getByText('customer')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    const cells = screen.getAllByText('2');
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it('should render edit and delete buttons per role', () => {
    renderWithProviders(<AdminRoleListPage />);

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it('should open create modal when Create Role is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminRoleListPage />);

    await user.click(screen.getByRole('button', { name: 'Create Role' }));

    expect(screen.getByText('Create Role', { selector: 'h2' })).toBeInTheDocument();
  });

  it('should open edit modal when Edit is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminRoleListPage />);

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    await user.click(editButtons[0]);

    expect(screen.getByText('Edit Role')).toBeInTheDocument();
    expect(screen.getByLabelText('Role Name')).toBeInTheDocument();
  });

  it('should call delete mutation when confirmed', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<AdminRoleListPage />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(mockDeleteMutate).toHaveBeenCalledWith(1);
  });

  it('should not delete when user cancels confirm', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithProviders(<AdminRoleListPage />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    await user.click(deleteButtons[0]);

    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });
});
