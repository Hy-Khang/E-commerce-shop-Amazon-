import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useCategories } from '../hooks/useCategories';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { generateSlug } from '../utils/product.util';
import { createProductSchema, type CreateProductFormData } from '../types/product.types';
import { ImageUpload } from '../components/ImageUpload';
import { CategoryCascader } from '../components/CategoryCascader';
import { ApiError } from '@/core/api/api.types';

export default function AdminProductCreatePage() {
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
  });

  const name = watch('name');

  function handleNameBlur() {
    if (name && !watch('slug')) {
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
        <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
        <Link to={ROUTES.ADMIN_PRODUCTS} className="text-sm text-gray-600 hover:text-gray-900">
          Back to list
        </Link>
      </div>

      {createProduct.error instanceof ApiError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {createProduct.error.message}
        </div>
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

        <CategoryCascader
          categories={categories ?? []}
          value={watch('category_id')}
          onChange={(id) => setValue('category_id', id as number, { shouldValidate: true })}
          error={errors.category_id?.message}
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="option1_label" className="block text-sm font-medium text-gray-700">Variant Option 1</label>
            <input
              id="option1_label"
              {...register('option1_label')}
              placeholder="e.g. Color, RAM, Connectivity"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="option2_label" className="block text-sm font-medium text-gray-700">Variant Option 2</label>
            <input
              id="option2_label"
              {...register('option2_label')}
              placeholder="e.g. Size, Storage, DPI"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <ImageUpload
            label="Thumbnail"
            value={watch('thumbnail_url') || undefined}
            onUploaded={(url) => setValue('thumbnail_url', url, { shouldValidate: true })}
            onClear={() => setValue('thumbnail_url', '', { shouldValidate: true })}
          />
          {errors.thumbnail_url && <p className="mt-1 text-xs text-red-600">{errors.thumbnail_url.message}</p>}
        </div>

        <button
          type="submit"
          disabled={createProduct.isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createProduct.isPending ? 'Creating...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}
