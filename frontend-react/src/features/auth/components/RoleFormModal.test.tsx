import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleFormModal } from './RoleFormModal';
import { mockRoleWithUserCount } from '../tests/mocks/auth.mock';
import { ApiError } from '@/core/api/api.types';

describe('RoleFormModal', () => {
  const defaultProps = {
    role: null,
    isOpen: true,
    isPending: false,
    error: null,
    onSubmit: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<RoleFormModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Create Role')).not.toBeInTheDocument();
  });

  it('should render create mode when no role', () => {
    render(<RoleFormModal {...defaultProps} />);

    expect(screen.getByText('Create Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('should render edit mode with correct title and button', () => {
    const role = mockRoleWithUserCount({ name: 'moderator' });
    render(<RoleFormModal {...defaultProps} role={role} />);

    expect(screen.getByText('Edit Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('should not submit with empty name', async () => {
    const user = userEvent.setup();
    render(<RoleFormModal {...defaultProps} />);

    const input = screen.getByLabelText('Role Name');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await vi.waitFor(() => {
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  it('should call onSubmit with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const role = mockRoleWithUserCount({ name: 'moderator' });

    render(<RoleFormModal {...defaultProps} role={role} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Update' }));

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { name: 'moderator' },
        expect.anything(),
      );
    });
  });

  it('should call onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<RoleFormModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show pending state', () => {
    render(<RoleFormModal {...defaultProps} isPending={true} />);

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();
  });

  it('should display ApiError message', () => {
    const error = new ApiError('COMMON_001', 'Role name already exists', 409);
    render(<RoleFormModal {...defaultProps} error={error} />);

    expect(screen.getByText('Role name already exists')).toBeInTheDocument();
  });

  it('should display generic error for non-ApiError', () => {
    const error = new Error('Network error');
    render(<RoleFormModal {...defaultProps} error={error} />);

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });
});
