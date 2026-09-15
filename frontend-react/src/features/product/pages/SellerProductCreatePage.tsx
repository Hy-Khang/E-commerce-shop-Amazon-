import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useCategories } from '../hooks/useCategories';
import { useSellerCreateProduct } from '../hooks/useSellerCreateProduct';
import { generateSlug } from '../utils/product.util';
import { createProductSchema, type CreateProductFormData } from '../types/product.types';
import { ImageUpload } from '../components/ImageUpload';
import { CategoryCascader } from '../components/CategoryCascader';
import { ApiError } from '@/core/api/api.types';

export default function SellerProductCreatePage() {
  const { data: categories } = useCategories();
  const createProduct = useSellerCreateProduct();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
  });

  const categoryId = useWatch({ control, name: 'category_id' });
  const thumbnailUrl = useWatch({ control, name: 'thumbnail_url' });

  // Auto-fill slug from name on blur — imperative one-shot read, no subscription.
  function handleNameBlur() {
    const name = getValues('name');
    if (name && !getValues('slug')) {
      setValue('slug', generateSlug(name));
    }
  }

  function onSubmit(data: CreateProductFormData) {
    createProduct.mutate({
      ...data,
      thumbnail_url: data.thumbnail_url || undefined,
      option1_label: data.option1_label || undefined,
      option2_label: data.option2_label || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Product</h1>
        <Link to={ROUTES.SELLER_PRODUCTS} className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
          Back to list
        </Link>
      </div>

      {createProduct.error instanceof ApiError && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {createProduct.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            id="name"
            {...register('name')}
            onBlur={handleNameBlur}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Slug</label>
          <input
            id="slug"
            {...register('slug')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {errors.slug && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.slug.message}</p>}
        </div>

        <CategoryCascader
          categories={categories ?? []}
          value={categoryId}
          onChange={(id) => setValue('category_id', id as number, { shouldValidate: true })}
          error={errors.category_id?.message}
          leafOnly
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="option1_label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variant Option 1</label>
            <input
              id="option1_label"
              {...register('option1_label')}
              placeholder="e.g. Color, RAM, Connectivity"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="option2_label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variant Option 2</label>
            <input
              id="option2_label"
              {...register('option2_label')}
              placeholder="e.g. Size, Storage, DPI"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <ImageUpload
            label="Thumbnail"
            value={thumbnailUrl || undefined}
            onUploaded={(url) => setValue('thumbnail_url', url, { shouldValidate: true })}
            onClear={() => setValue('thumbnail_url', '', { shouldValidate: true })}
          />
          {errors.thumbnail_url && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.thumbnail_url.message}</p>}
        </div>

        <button
          type="submit"
          disabled={createProduct.isPending}
          className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {createProduct.isPending ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
