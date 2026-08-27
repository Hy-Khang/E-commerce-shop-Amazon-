import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoleSchema, type CreateRoleRequest, type RoleWithUserCount } from '../types/admin.types';
import { ApiError } from '@/core/api/api.types';
import { Button } from '@/common/components/ui/Button';
import { Drawer } from '@/common/components/ui/Drawer';

interface Props {
  role: RoleWithUserCount | null;
  isOpen: boolean;
  isPending: boolean;
  error: Error | null;
  onSubmit: (data: CreateRoleRequest) => void;
  onClose: () => void;
}

export function RoleFormModal({ role, isOpen, isPending, error, onSubmit, onClose }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleRequest>({
    resolver: zodResolver(createRoleSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({ name: role?.name ?? '' });
    }
  }, [isOpen, role, reset]);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      title={role ? 'Edit Role' : 'Create Role'}
      variant="modal"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
            {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
          </div>
        )}

        <div>
          <label htmlFor="role-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Role Name
          </label>
          <input
            id="role-name"
            type="text"
            {...register('name')}
            className="admin-input mt-1"
            placeholder="e.g. seller, moderator"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{errors.name.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            {isPending ? 'Saving...' : role ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
