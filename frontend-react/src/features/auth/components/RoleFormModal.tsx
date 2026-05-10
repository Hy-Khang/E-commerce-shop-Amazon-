import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoleSchema, type CreateRoleRequest, type RoleWithUserCount } from '../types/admin.types';
import { ApiError } from '@/core/api/api.types';

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">
          {role ? 'Edit Role' : 'Create Role'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error instanceof ApiError ? error.message : 'An unexpected error occurred'}
            </div>
          )}

          <div>
            <label htmlFor="role-name" className="block text-sm font-medium text-gray-700">
              Role Name
            </label>
            <input
              id="role-name"
              type="text"
              {...register('name')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. seller, moderator"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : role ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
