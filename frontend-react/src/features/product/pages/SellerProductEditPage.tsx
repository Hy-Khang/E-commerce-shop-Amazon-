import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useUnsavedChangesPrompt } from '@/common/hooks/useUnsavedChangesPrompt';
import { useSellerProduct } from '../hooks/useSellerProduct';
import { useSellerUpdateProduct } from '../hooks/useSellerUpdateProduct';
import { useCategories } from '../hooks/useCategories';
import { useSellerAddVariant, useSellerUpdateVariant, useSellerDeleteVariant } from '../hooks/useSellerVariants';
import { useSellerAddImage, useSellerUpdateImage, useSellerDeleteImage } from '../hooks/useSellerImages';
import { useSellerToggleProductActive } from '../hooks/useSellerToggleProductActive';
import { createProductSchema, type CreateProductFormData } from '../types/product.types';
import { ProductDetailsForm } from '../components/ProductDetailsForm';
import { VariantsManager } from '../components/VariantsManager';
import { ImagesManager } from '../components/ImagesManager';
import { ApiError } from '@/core/api/api.types';

export default function SellerProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading } = useSellerProduct(productId);
  const { data: categories } = useCategories();
  const updateProduct = useSellerUpdateProduct(productId);
  const toggleActive = useSellerToggleProductActive();
  const addVariant = useSellerAddVariant(productId);
  const updateVariant = useSellerUpdateVariant(productId);
  const deleteVariant = useSellerDeleteVariant(productId);
  const addImage = useSellerAddImage(productId);
  const updateImage = useSellerUpdateImage(productId);
  const deleteImage = useSellerDeleteImage(productId);

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
    } : undefined,
  });

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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-slate-500 dark:text-slate-400">Product not found.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit: {product.name}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleActive.mutate(productId)}
            disabled={toggleActive.isPending}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              product.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'
            }`}
          >
            {product.is_active ? 'Active' : 'Inactive'}
          </button>
          <Link to={ROUTES.SELLER_PRODUCTS} className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100">
            Back to list
          </Link>
        </div>
      </div>

      {updateProduct.error instanceof ApiError && (
        <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{updateProduct.error.message}</div>
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
