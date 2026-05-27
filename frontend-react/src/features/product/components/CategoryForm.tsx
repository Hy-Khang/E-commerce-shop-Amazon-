import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryFormData } from '../types/product.types';
import { useCategories } from '../hooks/useCategories';
import { generateSlug } from '../utils/product.util';
import { ApiError } from '@/core/api/api.types';

interface Props {
  defaultValues?: CreateCategoryFormData;
  onSubmit: (data: CreateCategoryFormData) => void;
  isPending: boolean;
  error: Error | null;
  submitLabel: string;
  excludeCategoryId?: number;
}

export function CategoryForm({ defaultValues, onSubmit, isPending, error, submitLabel, excludeCategoryId }: Props) {
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues,
  });

  const name = watch('name');

  function handleNameBlur() {
    if (name && !watch('slug')) {
      setValue('slug', generateSlug(name));
    }
  }

  const parentOptions = categories?.filter((cat) => cat.id !== excludeCategoryId) ?? [];

  return (
    <>
      {error instanceof ApiError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input
            id="name"
            {...register('name')}
            onBlur={handleNameBlur}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
          <input
            id="slug"
            {...register('slug')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>

        <div>
          <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">Parent Category</label>
          <select
            id="parent_id"
            {...register('parent_id', {
              setValueAs: (v: string) => (v === '' ? null : Number(v)),
            })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">None (root category)</option>
            {parentOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : submitLabel}
        </button>
      </form>
    </>
  );
}
