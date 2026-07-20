import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserStatusBadge } from './UserStatusBadge';

describe('UserStatusBadge', () => {
  it('should render Active when isActive is true', () => {
    render(<UserStatusBadge isActive={true} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render Inactive when isActive is false', () => {
    render(<UserStatusBadge isActive={false} />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should have green styling when active', () => {
    render(<UserStatusBadge isActive={true} />);

    const badge = screen.getByText('Active');
    expect(badge.className).toContain('bg-emerald-100');
    expect(badge.className).toContain('text-emerald-700');
  });

  it('should have red styling when inactive', () => {
    render(<UserStatusBadge isActive={false} />);

    const badge = screen.getByText('Inactive');
    expect(badge.className).toContain('bg-rose-100');
    expect(badge.className).toContain('text-rose-700');
  });
});
