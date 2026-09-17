import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useUnsavedChangesPrompt } from '@/common/hooks/useUnsavedChangesPrompt';
import { useCategories } from '../hooks/useCategories';
import { useSellerCreateProduct } from '../hooks/useSellerCreateProduct';
import { createProductSchema, type CreateProductFormData } from '../types/product.types';
import { ProductDetailsForm } from '../components/ProductDetailsForm';
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
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
  });

  useUnsavedChangesPrompt(isDirty && !isSubmitting && !createProduct.isSuccess);

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
          <Button type="submit" loading={createProduct.isPending} className="w-full">
            Create Product
          </Button>
        </form>
      </div>
    </div>
  );
}
