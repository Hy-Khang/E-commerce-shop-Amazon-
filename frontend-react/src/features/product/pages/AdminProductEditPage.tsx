import { useParams, Link } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useUnsavedChangesPrompt } from '@/common/hooks/useUnsavedChangesPrompt';
import { AdminShopSelect } from '@/features/shop';
import { useAdminProduct } from '../hooks/useAdminProduct';
import { useUpdateProduct } from '../hooks/useUpdateProduct';
import { useCategories } from '../hooks/useCategories';
import { useAddVariant, useUpdateVariant, useDeleteVariant } from '../hooks/useAdminVariants';
import { useAddImage, useUpdateImage, useDeleteImage } from '../hooks/useAdminImages';
import { useToggleProductActive } from '../hooks/useToggleProductActive';
import { createProductSchema, type CreateProductFormData } from '../types/product.types';
import { ProductDetailsForm } from '../components/ProductDetailsForm';
import { VariantsManager } from '../components/VariantsManager';
import { ImagesManager } from '../components/ImagesManager';
import { ApiError } from '@/core/api/api.types';

export default function AdminProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading } = useAdminProduct(productId);
  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct(productId);
  const toggleActive = useToggleProductActive();
  const addVariant = useAddVariant(productId);
  const updateVariant = useUpdateVariant(productId);
  const deleteVariant = useDeleteVariant(productId);
  const addImage = useAddImage(productId);
  const updateImage = useUpdateImage(productId);
  const deleteImage = useDeleteImage(productId);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isDirty, isSubmitting },
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
      shop_id: product.shop_id ?? null,
    } : undefined,
  });

  const shopId = useWatch({ control, name: 'shop_id' });
  useUnsavedChangesPrompt(isDirty && !isSubmitting);

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
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-slate-500 dark:text-slate-400">Product not found.</div>;
  }

  return (
    <div className="space-y-8">
      <Link
        to={ROUTES.ADMIN_PRODUCTS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Edit: {product.name}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleActive.mutate(productId)}
            disabled={toggleActive.isPending}
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              product.is_active ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {product.is_active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>

      {updateProduct.error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{updateProduct.error.message}</div>
      )}

      <div className="admin-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ProductDetailsForm
            register={register}
            control={control}
            setValue={setValue}
            getValues={getValues}
            errors={errors}
            categories={categories ?? []}
            shopSlot={
              <div>
                <label htmlFor="shop_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Shop</label>
                <AdminShopSelect
                  id="shop_id"
                  className="mt-1"
                  value={shopId ?? null}
                  onChange={(id) => setValue('shop_id', id, { shouldDirty: true })}
                />
              </div>
            }
          />
          <Button type="submit" loading={updateProduct.isPending}>
            Save Changes
          </Button>
        </form>
      </div>

      <VariantsManager
        variants={product.variants}
        option1Label={product.option1_label}
        option2Label={product.option2_label}
        skuBase={product.slug}
        addVariant={addVariant}
        updateVariant={updateVariant}
        deleteVariant={deleteVariant}
      />

      <ImagesManager
        images={product.images}
        variants={product.variants}
        option1Label={product.option1_label}
        addImage={addImage}
        updateImage={updateImage}
        deleteImage={deleteImage}
      />
    </div>
  );
}
