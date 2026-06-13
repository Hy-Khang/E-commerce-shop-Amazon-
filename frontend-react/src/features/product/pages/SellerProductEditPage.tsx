import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, getImageUrl } from '@/common/utils/format.util';
import { useSellerProduct } from '../hooks/useSellerProduct';
import { useSellerUpdateProduct } from '../hooks/useSellerUpdateProduct';
import { useCategories } from '../hooks/useCategories';
import { useSellerAddVariant, useSellerUpdateVariant, useSellerDeleteVariant } from '../hooks/useSellerVariants';
import { useSellerAddImage, useSellerDeleteImage } from '../hooks/useSellerImages';
import { useSellerToggleProductActive } from '../hooks/useSellerToggleProductActive';
import { createProductSchema, createVariantSchema, type CreateProductFormData, type CreateVariantFormData, type ProductVariant } from '../types/product.types';
import { ImageUpload } from '../components/ImageUpload';
import { CategoryCascader } from '../components/CategoryCascader';
import { ApiError } from '@/core/api/api.types';
import { getUniqueOptionValues } from '../utils/product.util';

function SellerVariantForm({ productId, option1Label, option2Label }: { productId: number; option1Label: string | null; option2Label: string | null }) {
  const addVariant = useSellerAddVariant(productId);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-gray-50 p-4">
      <h4 className="text-sm font-medium text-gray-700">Add Variant</h4>
      {addVariant.error instanceof ApiError && (
        <div className="text-xs text-red-600">{addVariant.error.message}</div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <input {...register('sku')} placeholder="SKU" className="w-full rounded-md border px-2 py-1.5 text-sm" />
          {errors.sku && <p className="mt-0.5 text-xs text-red-600">{errors.sku.message}</p>}
        </div>
        {option1Label && (
          <input {...register('option1')} placeholder={option1Label} className="rounded-md border px-2 py-1.5 text-sm" />
        )}
        {option2Label && (
          <input {...register('option2')} placeholder={option2Label} className="rounded-md border px-2 py-1.5 text-sm" />
        )}
        <div>
          <input {...register('price', { valueAsNumber: true })} type="number" step="0.01" placeholder="Price" className="w-full rounded-md border px-2 py-1.5 text-sm" />
          {errors.price && <p className="mt-0.5 text-xs text-red-600">{errors.price.message}</p>}
        </div>
        <input {...register('sale_price', { valueAsNumber: true })} type="number" step="0.01" placeholder="Sale price" className="rounded-md border px-2 py-1.5 text-sm" />
        <div>
          <input {...register('stock_quantity', { valueAsNumber: true })} type="number" placeholder="Stock" className="w-full rounded-md border px-2 py-1.5 text-sm" />
          {errors.stock_quantity && <p className="mt-0.5 text-xs text-red-600">{errors.stock_quantity.message}</p>}
        </div>
      </div>
      <button type="submit" disabled={addVariant.isPending} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
        {addVariant.isPending ? 'Adding...' : 'Add Variant'}
      </button>
    </form>
  );
}

function SellerImageForm({ productId, variants, option1Label }: { productId: number; variants: ProductVariant[]; option1Label: string | null }) {
  const addImage = useSellerAddImage(productId);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-gray-50 p-4">
      <ImageUpload
        label="Gallery Image"
        value={imageUrl || undefined}
        onUploaded={(url) => setValue('image_url', url)}
        onClear={() => setValue('image_url', '')}
      />
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-gray-500">Sort order</label>
          <input {...register('sort_order', { valueAsNumber: true })} type="number" className="w-20 rounded-md border px-2 py-1.5 text-sm" />
        </div>
        {option1Values.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500">{option1Label}</label>
            <select {...register('variant_option1')} className="rounded-md border px-2 py-1.5 text-sm">
              <option value="">Shared (all variants)</option>
              {option1Values.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        )}
        <button type="submit" disabled={addImage.isPending || !imageUrl} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
          {addImage.isPending ? 'Adding...' : 'Add Image'}
        </button>
      </div>
    </form>
  );
}

export default function SellerProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading } = useSellerProduct(productId);
  const { data: categories } = useCategories();
  const updateProduct = useSellerUpdateProduct(productId);
  const toggleActive = useSellerToggleProductActive();
  const deleteVariant = useSellerDeleteVariant(productId);
  const deleteImage = useSellerDeleteImage(productId);

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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-64 rounded bg-gray-200" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-gray-500">Product not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit: {product.name}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleActive.mutate(productId)}
            disabled={toggleActive.isPending}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {product.is_active ? 'Active' : 'Inactive'}
          </button>
          <Link to={ROUTES.SELLER_PRODUCTS} className="text-sm text-gray-600 hover:text-gray-900">
            Back to list
          </Link>
        </div>
      </div>

      {updateProduct.error instanceof ApiError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{updateProduct.error.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input id="name" {...register('name')} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
            <input id="slug" {...register('slug')} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          </div>
        </div>
        <CategoryCascader
          categories={categories ?? []}
          value={watch('category_id')}
          onChange={(id) => setValue('category_id', id as number, { shouldValidate: true })}
          error={errors.category_id?.message}
        />
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" rows={4} {...register('description')} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="option1_label" className="block text-sm font-medium text-gray-700">Variant Option 1</label>
            <input id="option1_label" {...register('option1_label')} placeholder="e.g. Color, RAM, Connectivity" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="option2_label" className="block text-sm font-medium text-gray-700">Variant Option 2</label>
            <input id="option2_label" {...register('option2_label')} placeholder="e.g. Size, Storage, DPI" className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
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
        <button type="submit" disabled={updateProduct.isPending} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
          {updateProduct.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Variants ({product.variants.length})</h2>
        {product.variants.length > 0 && (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">SKU</th>
                  {product.option1_label && <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{product.option1_label}</th>}
                  {product.option2_label && <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">{product.option2_label}</th>}
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Sale</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Stock</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {product.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="px-3 py-2 text-sm font-mono">{v.sku}</td>
                    {product.option1_label && <td className="px-3 py-2 text-sm">{v.option1 || '—'}</td>}
                    {product.option2_label && <td className="px-3 py-2 text-sm">{v.option2 || '—'}</td>}
                    <td className="px-3 py-2 text-sm">{formatPrice(v.price)}</td>
                    <td className="px-3 py-2 text-sm">{v.sale_price ? formatPrice(v.sale_price) : '—'}</td>
                    <td className="px-3 py-2 text-sm">{v.stock_quantity}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => deleteVariant.mutate(v.id)}
                        disabled={deleteVariant.isPending}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SellerVariantForm productId={productId} option1Label={product.option1_label} option2Label={product.option2_label} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Images ({product.images.length})</h2>
        {product.images.length > 0 && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {[...product.images].sort((a, b) => a.sort_order - b.sort_order).map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-md border">
                <img src={getImageUrl(img.image_url)} alt="" className="aspect-square w-full object-cover" />
                <button
                  onClick={() => deleteImage.mutate(img.id)}
                  disabled={deleteImage.isPending}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  X
                </button>
                <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-black/50 px-1.5 py-0.5">
                  <span className="text-xs text-white">#{img.sort_order}</span>
                  {img.variant_option1 && (
                    <span className="rounded bg-sky-500/80 px-1 text-[10px] font-medium text-white">{img.variant_option1}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <SellerImageForm productId={productId} variants={product.variants} option1Label={product.option1_label} />
      </section>
    </div>
  );
}
