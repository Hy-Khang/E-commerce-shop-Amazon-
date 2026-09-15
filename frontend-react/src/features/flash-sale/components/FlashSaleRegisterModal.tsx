import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Drawer } from '@/common/components/ui/Drawer';
import { ApiError } from '@/core/api/api.types';
import { formatPrice } from '@/common/utils/format.util';
import { useSellerProducts } from '@/features/product';
import { useRegisterFlashItem } from '../hooks/useSellerFlashSaleMutations';
import {
  registerFlashSaleItemFormSchema,
  type RegisterFlashSaleItemFormData,
  type FlashSale,
} from '../types/flash-sale.types';

interface Props {
  campaign: FlashSale | null;
  onClose: () => void;
}

interface VariantOption {
  id: number;
  label: string;
  price: number;
}

export function FlashSaleRegisterModal({ campaign, onClose }: Props) {
  const open = campaign !== null;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={campaign ? `Register — ${campaign.name}` : 'Flash Sale registration'}
      variant="modal"
      size="lg"
    >
      {campaign && (
        <RegisterBody key={campaign.id} campaign={campaign} onClose={onClose} />
      )}
    </Drawer>
  );
}

function RegisterBody({ campaign, onClose }: { campaign: FlashSale; onClose: () => void }) {
  const { data: products, isLoading } = useSellerProducts(
    { page: 1, limit: 100, is_active: true },
    { enabled: true },
  );
  const register = useRegisterFlashItem();

  const variants: VariantOption[] = useMemo(() => {
    const list: VariantOption[] = [];
    for (const p of products?.data ?? []) {
      for (const v of p.variants) {
        const opts = [v.option1, v.option2].filter(Boolean).join(' / ');
        list.push({
          id: v.id,
          label: `${p.name}${opts ? ` — ${opts}` : ''} (${formatPrice(v.price)})`,
          price: v.price,
        });
      }
    }
    return list;
  }, [products]);

  const form = useForm<RegisterFlashSaleItemFormData>({
    resolver: zodResolver(registerFlashSaleItemFormSchema),
    defaultValues: { product_variant_id: 0, flash_price: 0, flash_quantity: 0 },
  });
  const {
    register: rhf,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = form;

  const selectedId = watch('product_variant_id');
  const selected = variants.find((v) => v.id === Number(selectedId));
  const maxPrice = selected
    ? Math.floor((selected.price * (100 - campaign.min_discount_percent)) / 100)
    : null;

  function onSubmit(data: RegisterFlashSaleItemFormData) {
    // Client-side floor guard (server re-validates → FLASH_SALE_011).
    if (maxPrice != null && data.flash_price > maxPrice) {
      setError('flash_price', {
        message: `At most ${formatPrice(maxPrice)} to reach -${campaign.min_discount_percent}%`,
      });
      return;
    }
    register.mutate(
      { campaignId: campaign.id, data },
      { onSuccess: onClose },
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {register.error instanceof ApiError && (
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {register.error.message}
        </div>
      )}

      <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        At least <strong>{campaign.min_discount_percent}%</strong> off the original price.
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Product / variant
        </label>
        <select
          className="admin-input"
          {...rhf('product_variant_id', { valueAsNumber: true })}
        >
          <option value={0}>-- Select a variant --</option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        {errors.product_variant_id && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {errors.product_variant_id.message}
          </p>
        )}
        {variants.length === 0 && (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Your shop has no products to register yet.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Flash Sale price
          </label>
          <input
            type="number"
            min={1}
            step="any"
            className="admin-input"
            {...rhf('flash_price', { valueAsNumber: true })}
          />
          {maxPrice != null && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              At most {formatPrice(maxPrice)} (original {formatPrice(selected!.price)})
            </p>
          )}
          {errors.flash_price && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
              {errors.flash_price.message}
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Quantity
          </label>
          <input
            type="number"
            min={1}
            className="admin-input"
            {...rhf('flash_quantity', { valueAsNumber: true })}
          />
          {errors.flash_quantity && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
              {errors.flash_quantity.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="submit"
          disabled={register.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {register.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit registration
        </button>
      </div>
    </form>
  );
}
