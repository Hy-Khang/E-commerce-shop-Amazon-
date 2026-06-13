import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Trash2, X } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, getImageUrl } from '@/common/utils/format.util';
import { Button } from '@/common/components/ui/Button';
import { useAdminProduct } from '../hooks/useAdminProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { useCategories } from '../hooks/useCategories';
import { useAddVariant, useUpdateVariant, useDeleteVariant } from '../hooks/useAdminVariants';
import { useAddImage, useDeleteImage } from '../hooks/useAdminImages';
import { useToggleProductActive } from '../hooks/useToggleProductActive';
import { createProductSchema, createVariantSchema, type CreateProductFormData, type CreateVariantFormData, type ProductVariant } from '../types/product.types';
import { ImageUpload } from '../components/ImageUpload';
import { CategoryCascader } from '../components/CategoryCascader';
import { ApiError } from '@/core/api/api.types';
import { getUniqueOptionValues } from '../utils/product.util';

function VariantForm({ productId, option1Label, option2Label }: { productId: number; option1Label: string | null; option2Label: string | null }) {
  const addVariant = useAddVariant(productId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateVariantFormData>({
    resolver: zodResolver(createVariantSchema),
  });

  function onSubmit(data: CreateVariantFormData) {
    addVariant.mutate(
      {
        ...data,
        option1: data.option1 || undefined,
        option2: data.option2 || undefined,
        sale_price: data.sale_price ?? undefined,
      },
      { onSuccess: () => reset() },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl bg-slate-50 p-4">
      <h4 className="text-sm font-semibold text-slate-900">Add Variant</h4>
      {addVariant.error instanceof ApiError && (
        <div className="text-xs text-rose-600">{addVariant.error.message}</div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <input {...register('sku')} placeholder="SKU" className="admin-input" />
          {errors.sku && <p className="mt-0.5 text-xs text-rose-600">{errors.sku.message}</p>}
        </div>
        {option1Label && (
          <input {...register('option1')} placeholder={option1Label} className="admin-input" />
        )}
        {option2Label && (
          <input {...register('option2')} placeholder={option2Label} className="admin-input" />
        )}
        <div>
          <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" placeholder="Price" className="admin-input" />
          {errors.price && <p className="mt-0.5 text-xs text-rose-600">{errors.price.message}</p>}
        </div>
        <input {...register('sale_price', { valueAsNumber: true })} type="number" step="0.01" placeholder="Sale price" className="admin-input" />
        <div>
          <input {...register('stock_quantity', { valueAsNumber: true })} type="number" placeholder="Stock" className="admin-input" />
          {errors.stock_quantity && <p className="mt-0.5 text-xs text-rose-600">{errors.stock_quantity.message}</p>}
        </div>
      </div>
      <Button type="submit" loading={addVariant.isPending} size="sm">
        Add Variant
      </Button>
    </form>
  );
}

function ImageForm({ productId, variants, option1Label }: { productId: number; variants: ProductVariant[]; option1Label: string | null }) {
  const addImage = useAddImage(productId);
  const { register, handleSubmit, reset, setValue, watch } = useForm<{ image_url: string; sort_order: number; variant_option1: string }>({
    defaultValues: { image_url: '', sort_order: 0, variant_option1: '' },
  });

  const imageUrl = watch('image_url');
  const option1Values = option1Label ? getUniqueOptionValues(variants, 'option1') : [];

  function onSubmit(data: { image_url: string; sort_order: number; variant_option1: string }) {
    if (!data.image_url) return;
    addImage.mutate(
      {
        image_url: data.image_url,
        sort_order: data.sort_order,
        ...(data.variant_option1 ? { variant_option1: data.variant_option1 } : {}),
      },
      { onSuccess: () => reset() },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl bg-slate-50 p-4">
      <ImageUpload
        label="Gallery Image"
        value={imageUrl || undefined}
        onUploaded={(url) => setValue('image_url', url)}
        onClear={() => setValue('image_url', '')}
      />
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-slate-500">Sort order</label>
          <input {...register('sort_order', { valueAsNumber: true })} type="number" className="admin-input w-20" />
        </div>
        {option1Values.length > 0 && (
          <div>
            <label className="block text-xs text-slate-500">{option1Label}</label>
            <select {...register('variant_option1')} className="admin-input">
              <option value="">Shared (all variants)</option>
              {option1Values.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        )}
        <Button type="submit" loading={addImage.isPending} size="sm" disabled={!imageUrl}>
          Add Image
        </Button>
      </div>
    </form>
  );
}

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading } = useAdminProduct(productId);
  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct(productId);
  const toggleActive = useToggleProductActive();
  const _updateVariant = useUpdateVariant(productId);
  const deleteVariant = useDeleteVariant(productId);
  const deleteImage = useDeleteImage(productId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    values: product ? {
      name: product.name,
      slug: product.slug,
      category_id: product.category_id,
      description: product.description ?? '',
      thumbnail_url: product.thumbnail_url ?? '',
      option1_label: product.option1_label ?? '',
      option2_label: product.option2_label ?? '',
    } : undefined,
  });

  function onSubmit(data: CreateProductFormData) {
    updateProduct.mutate({
      ...data,
      thumbnail_url: data.thumbnail_url || undefined,
      option1_label: data.option1_label || undefined,
      option2_label: data.option2_label || undefined,
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-slate-500">Product not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Link
        to={ROUTES.ADMIN_PRODUCTS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit: {product.name}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleActive.mutate(productId)}
            disabled={toggleActive.isPending}
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              product.is_active ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {product.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {updateProduct.error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{updateProduct.error.message}</div>
      )}

      <div className="admin-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
              <input id="name" {...register('name')} className="admin-input mt-1" />
              {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700">Slug</label>
              <input id="slug" {...register('slug')} className="admin-input mt-1" />
              {errors.slug && <p className="mt-1 text-xs text-rose-600">{errors.slug.message}</p>}
            </div>
          </div>
          <CategoryCascader
            categories={categories ?? []}
            value={watch('category_id')}
            onChange={(id) => setValue('category_id', id as number, { shouldValidate: true })}
            error={errors.category_id?.message}
          />
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
            <textarea id="description" rows={4} {...register('description')} className="admin-input mt-1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="option1_label" className="block text-sm font-medium text-slate-700">Variant Option 1</label>
              <input id="option1_label" {...register('option1_label')} placeholder="e.g. Color, RAM, Connectivity" className="admin-input mt-1" />
            </div>
            <div>
              <label htmlFor="option2_label" className="block text-sm font-medium text-slate-700">Variant Option 2</label>
              <input id="option2_label" {...register('option2_label')} placeholder="e.g. Size, Storage, DPI" className="admin-input mt-1" />
            </div>
          </div>
          <div>
            <ImageUpload
              label="Thumbnail"
              value={watch('thumbnail_url') || undefined}
              onUploaded={(url) => setValue('thumbnail_url', url, { shouldValidate: true })}
              onClear={() => setValue('thumbnail_url', '', { shouldValidate: true })}
            />
            {errors.thumbnail_url && <p className="mt-1 text-xs text-rose-600">{errors.thumbnail_url.message}</p>}
          </div>
          <Button type="submit" loading={updateProduct.isPending}>
            Save Changes
          </Button>
        </form>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Variants ({product.variants.length})</h2>
        {product.variants.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="admin-table-header">
                    <th className="px-6 py-3.5 text-left">SKU</th>
                    {product.option1_label && <th className="px-6 py-3.5 text-left">{product.option1_label}</th>}
                    {product.option2_label && <th className="px-6 py-3.5 text-left">{product.option2_label}</th>}
                    <th className="px-6 py-3.5 text-left">Price</th>
                    <th className="px-6 py-3.5 text-left">Sale</th>
                    <th className="px-6 py-3.5 text-left">Stock</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.variants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{v.sku}</td>
                      {product.option1_label && <td className="px-6 py-4 text-sm text-slate-700">{v.option1 || '—'}</td>}
                      {product.option2_label && <td className="px-6 py-4 text-sm text-slate-700">{v.option2 || '—'}</td>}
                      <td className="px-6 py-4 text-sm text-slate-700">{formatPrice(v.price)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{v.sale_price ? formatPrice(v.sale_price) : '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{v.stock_quantity}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          iconOnly
                          icon={Trash2}
                          aria-label="Delete variant"
                          onClick={() => deleteVariant.mutate(v.id)}
                          disabled={deleteVariant.isPending}
                          className="hover:!text-rose-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <VariantForm productId={productId} option1Label={product.option1_label} option2Label={product.option2_label} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Images ({product.images.length})</h2>
        {product.images.length > 0 && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {[...product.images].sort((a, b) => a.sort_order - b.sort_order).map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-lg ring-1 ring-slate-900/5">
                <img src={getImageUrl(img.image_url)} alt="" className="aspect-square w-full object-cover" />
                <button
                  onClick={() => deleteImage.mutate(img.id)}
                  disabled={deleteImage.isPending}
                  className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Delete image"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-slate-900/60 px-1.5 py-0.5">
                  <span className="text-xs text-white">#{img.sort_order}</span>
                  {img.variant_option1 && (
                    <span className="rounded bg-sky-500/80 px-1 text-[10px] font-medium text-white">{img.variant_option1}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <ImageForm productId={productId} variants={product.variants} option1Label={product.option1_label} />
      </section>
    </div>
  );
}
