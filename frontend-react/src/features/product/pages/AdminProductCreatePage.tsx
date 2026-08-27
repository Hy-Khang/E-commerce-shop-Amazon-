import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useAdminShops } from '@/features/shop';
import { useCategories } from '../hooks/useCategories';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { generateSlug } from '../utils/product.util';
import { createProductSchema, type CreateProductFormData } from '../types/product.types';
import { ImageUpload } from '../components/ImageUpload';
import { CategoryCascader } from '../components/CategoryCascader';
import { ApiError } from '@/core/api/api.types';

export default function AdminProductCreatePage() {
  const { data: categories } = useCategories();
  const { data: shopData } = useAdminShops({ page: 1, limit: 100 });
  const createProduct = useCreateProduct();
  const shopOptions = shopData?.data ?? [];

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
  const shopId = useWatch({ control, name: 'shop_id' });

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
      <Link
        to={ROUTES.ADMIN_PRODUCTS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Create Product</h1>

      {createProduct.error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {createProduct.error.message}
        </div>
      )}

      <div className="admin-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input id="name" {...register('name')} onBlur={handleNameBlur} className="admin-input mt-1" />
            {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Slug</label>
            <input id="slug" {...register('slug')} className="admin-input mt-1" />
            {errors.slug && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.slug.message}</p>}
          </div>

          <CategoryCascader
            categories={categories ?? []}
            value={categoryId}
            onChange={(id) => setValue('category_id', id as number, { shouldValidate: true })}
            error={errors.category_id?.message}
          />

          <div>
            <label htmlFor="shop_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Shop</label>
            <select
              id="shop_id"
              className="admin-input mt-1"
              value={shopId ?? ''}
              onChange={(e) => setValue('shop_id', e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">— No shop —</option>
              {shopOptions.map((shop) => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <textarea id="description" rows={4} {...register('description')} className="admin-input mt-1" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="option1_label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variant Option 1</label>
              <input id="option1_label" {...register('option1_label')} placeholder="e.g. Color, RAM, Connectivity" className="admin-input mt-1" />
            </div>
            <div>
              <label htmlFor="option2_label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variant Option 2</label>
              <input id="option2_label" {...register('option2_label')} placeholder="e.g. Size, Storage, DPI" className="admin-input mt-1" />
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

          <Button type="submit" loading={createProduct.isPending} className="w-full">
            Create Product
          </Button>
        </form>
      </div>
    </div>
  );
}
