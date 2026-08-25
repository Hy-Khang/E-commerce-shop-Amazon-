import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryFormData } from '../types/product.types';
import { useCategories } from '../hooks/useCategories';
import { generateSlug } from '../utils/product.util';
import { ApiError } from '@/core/api/api.types';
import { Button } from '@/common/components/ui/Button';

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
    getValues,
    formState: { errors },
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues,
  });

  // Auto-fill slug from name on blur — imperative one-shot read, no subscription.
  function handleNameBlur() {
    const name = getValues('name');
    if (name && !getValues('slug')) {
      setValue('slug', generateSlug(name));
    }
  }

  const parentOptions = categories?.filter((cat) => cat.id !== excludeCategoryId) ?? [];

  return (
    <>
      {error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
          <input
            id="name"
            {...register('name')}
            onBlur={handleNameBlur}
            className="admin-input mt-1"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug</label>
          <input
            id="slug"
            {...register('slug')}
            className="admin-input mt-1"
          />
          {errors.slug && <p className="mt-1 text-xs text-rose-600">{errors.slug.message}</p>}
        </div>

        <div>
          <label htmlFor="parent_id" className="block text-sm font-medium text-slate-700">Parent Category</label>
          <select
            id="parent_id"
            {...register('parent_id', {
              setValueAs: (v: string) => (v === '' ? null : Number(v)),
            })}
            className="admin-input mt-1"
          >
            <option value="">None (root category)</option>
            {parentOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <Button type="submit" loading={isPending} className="w-full">
          {submitLabel}
        </Button>
      </form>
    </>
  );
}
