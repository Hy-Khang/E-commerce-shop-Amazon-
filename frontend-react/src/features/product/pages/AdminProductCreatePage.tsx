import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { Button } from '@/common/components/ui/Button';
import { useUnsavedChangesPrompt } from '@/common/hooks/useUnsavedChangesPrompt';
import { AdminShopSelect } from '@/features/shop';
import { useCategories } from '../hooks/useCategories';
import { useCreateProduct } from '../hooks/useCreateProduct';
import { createProductSchema, type CreateProductFormData } from '../types/product.types';
import { ProductDetailsForm } from '../components/ProductDetailsForm';
import { ApiError } from '@/core/api/api.types';

export default function AdminProductCreatePage() {
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();

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

  const shopId = useWatch({ control, name: 'shop_id' });
  useUnsavedChangesPrompt(isDirty && !isSubmitting && !createProduct.isSuccess);

  function onSubmit(data: CreateProductFormData) {
    createProduct.mutate({
      ...data,
      thumbnail_url: data.thumbnail_url || undefined,
      option1_label: data.option1_label || undefined,
      option2_label: data.option2_label || undefined,
      shop_id: data.shop_id ?? undefined,
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
          <Button type="submit" loading={createProduct.isPending} className="w-full">
            Create Product
          </Button>
        </form>
      </div>
    </div>
  );
}
