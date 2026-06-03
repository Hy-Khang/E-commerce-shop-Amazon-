import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice } from '@/common/utils/format.util';
import { useAdminProduct } from '../hooks/useAdminProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { useCategories } from '../hooks/useCategories';
import { useAddVariant, useUpdateVariant, useDeleteVariant } from '../hooks/useAdminVariants';
import { useAddImage, useDeleteImage } from '../hooks/useAdminImages';
import { useToggleProductActive } from '../hooks/useToggleProductActive';
import { createProductSchema, createVariantSchema, type CreateProductFormData, type CreateVariantFormData } from '../types/product.types';
import { ImageUpload } from '../components/ImageUpload';
import { ApiError } from '@/core/api/api.types';

function VariantForm({ productId }: { productId: number }) {
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
        color: data.color || undefined,
        size: data.size || undefined,
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
        <input {...register('color')} placeholder="Color" className="rounded-md border px-2 py-1.5 text-sm" />
        <input {...register('size')} placeholder="Size" className="rounded-md border px-2 py-1.5 text-sm" />
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

function ImageForm({ productId }: { productId: number }) {
  const addImage = useAddImage(productId);
  const { register, handleSubmit, reset, setValue, watch } = useForm<{ image_url: string; sort_order: number }>({
    defaultValues: { image_url: '', sort_order: 0 },
  });

  const imageUrl = watch('image_url');

  function onSubmit(data: { image_url: string; sort_order: number }) {
    if (!data.image_url) return;
    addImage.mutate(data, { onSuccess: () => reset() });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-gray-50 p-4">
      <ImageUpload
        label="Gallery Image"
        value={imageUrl || undefined}
        onUploaded={(url) => setValue('image_url', url)}
        onClear={() => setValue('image_url', '')}
      />
      <div className="flex items-end gap-2">
        <div>
          <label className="block text-xs text-gray-500">Sort order</label>
          <input {...register('sort_order', { valueAsNumber: true })} type="number" className="w-20 rounded-md border px-2 py-1.5 text-sm" />
        </div>
        <button type="submit" disabled={addImage.isPending || !imageUrl} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
          {addImage.isPending ? 'Adding...' : 'Add Image'}
        </button>
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
  const updateVariant = useUpdateVariant(productId);
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
    } : undefined,
  });

  function onSubmit(data: CreateProductFormData) {
    updateProduct.mutate({
      ...data,
      thumbnail_url: data.thumbnail_url || undefined,
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
          <Link to={ROUTES.ADMIN_PRODUCTS} className="text-sm text-gray-600 hover:text-gray-900">
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
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">Category</label>
          <select id="category_id" {...register('category_id', { valueAsNumber: true })} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <option value="">Select category</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" rows={4} {...register('description')} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
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
        <button type="submit" disabled={updateProduct.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
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
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Color</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-500">Size</th>
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
                    <td className="px-3 py-2 text-sm">{v.color || '—'}</td>
                    <td className="px-3 py-2 text-sm">{v.size || '—'}</td>
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
        <VariantForm productId={productId} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Images ({product.images.length})</h2>
        {product.images.length > 0 && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {[...product.images].sort((a, b) => a.sort_order - b.sort_order).map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-md border">
                <img src={img.image_url} alt="" className="aspect-square w-full object-cover" />
                <button
                  onClick={() => deleteImage.mutate(img.id)}
                  disabled={deleteImage.isPending}
                  className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  X
                </button>
                <span className="absolute bottom-0 left-0 bg-black/50 px-1.5 text-xs text-white">
                  #{img.sort_order}
                </span>
              </div>
            ))}
          </div>
        )}
        <ImageForm productId={productId} />
      </section>
    </div>
  );
}
