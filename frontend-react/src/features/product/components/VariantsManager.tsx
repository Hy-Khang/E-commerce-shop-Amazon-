import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { formatPrice } from '@/common/utils/format.util';
import { ApiError } from '@/core/api/api.types';
import { generateSlug } from '../utils/product.util';
import {
  createVariantSchema,
  updateVariantSchema,
  type CreateVariantFormData,
  type CreateVariantRequest,
  type ProductVariant,
  type UpdateVariantFormData,
  type UpdateVariantRequest,
} from '../types/product.types';

/** Minimal shapes of the TanStack mutation results the page passes in (structurally compatible). */
interface AddVariantMutation {
  mutate: (data: CreateVariantRequest, options?: { onSuccess?: () => void }) => void;
  isPending: boolean;
  error: unknown;
}
interface UpdateVariantMutation {
  mutate: (
    vars: { variantId: number; data: UpdateVariantRequest },
    options?: { onSuccess?: () => void },
  ) => void;
  isPending: boolean;
  error: unknown;
}
interface DeleteVariantMutation {
  mutate: (variantId: number) => void;
  isPending: boolean;
}

interface VariantsManagerProps {
  variants: ProductVariant[];
  option1Label: string | null;
  option2Label: string | null;
  /** Product slug — seeds an auto-suggested SKU in the add form. */
  skuBase?: string;
  addVariant: AddVariantMutation;
  updateVariant: UpdateVariantMutation;
  deleteVariant: DeleteVariantMutation;
}

/** Number input value → payload: empty/NaN becomes null (used to clear sale_price). */
function numOrNull(value: number | undefined): number | null {
  return value === undefined || Number.isNaN(value) ? null : value;
}

/** Build an uppercase SKU from the product slug + chosen options, e.g. AO-THUN-DEN-L. */
function suggestSku(base: string | undefined, option1?: string, option2?: string): string {
  const parts = [base, option1, option2].filter(Boolean).map((p) => generateSlug(p as string));
  return parts.join('-').toUpperCase().slice(0, 50);
}

export function VariantsManager({
  variants,
  option1Label,
  option2Label,
  skuBase,
  addVariant,
  updateVariant,
  deleteVariant,
}: VariantsManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductVariant | null>(null);
  const colCount = 4 + (option1Label ? 1 : 0) + (option2Label ? 1 : 0);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Variants ({variants.length})</h2>

      {variants.length > 0 && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="admin-table-header">
                  <th className="px-6 py-3.5 text-left">SKU</th>
                  {option1Label && <th className="px-6 py-3.5 text-left">{option1Label}</th>}
                  {option2Label && <th className="px-6 py-3.5 text-left">{option2Label}</th>}
                  <th className="px-6 py-3.5 text-left">Price</th>
                  <th className="px-6 py-3.5 text-left">Sale</th>
                  <th className="px-6 py-3.5 text-left">Stock</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {variants.map((v) =>
                  editingId === v.id ? (
                    <VariantEditRow
                      key={v.id}
                      variant={v}
                      option1Label={option1Label}
                      option2Label={option2Label}
                      colCount={colCount}
                      pending={updateVariant.isPending}
                      error={updateVariant.error}
                      onCancel={() => setEditingId(null)}
                      onSave={(data) =>
                        updateVariant.mutate(
                          { variantId: v.id, data },
                          { onSuccess: () => setEditingId(null) },
                        )
                      }
                    />
                  ) : (
                    <tr key={v.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-mono text-sm text-slate-700 dark:text-slate-300">{v.sku}</td>
                      {option1Label && <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{v.option1 || '—'}</td>}
                      {option2Label && <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{v.option2 || '—'}</td>}
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{formatPrice(v.price)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{v.sale_price ? formatPrice(v.sale_price) : '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{v.stock_quantity}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            iconOnly
                            icon={Pencil}
                            aria-label="Edit variant"
                            onClick={() => setEditingId(v.id)}
                            disabled={editingId !== null}
                            className="hover:!text-teal-600"
                          />
                          <Button
                            variant="ghost"
                            iconOnly
                            icon={Trash2}
                            aria-label="Delete variant"
                            onClick={() => setDeleteTarget(v)}
                            disabled={deleteVariant.isPending || editingId !== null}
                            className="hover:!text-rose-600"
                          />
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VariantAddForm
        option1Label={option1Label}
        option2Label={option2Label}
        skuBase={skuBase}
        addVariant={addVariant}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete variant"
        message={`Delete variant "${deleteTarget?.sku}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteVariant.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteVariant.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}

function VariantEditRow({
  variant,
  option1Label,
  option2Label,
  colCount,
  pending,
  error,
  onCancel,
  onSave,
}: {
  variant: ProductVariant;
  option1Label: string | null;
  option2Label: string | null;
  colCount: number;
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onSave: (data: UpdateVariantRequest) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateVariantFormData>({
    resolver: zodResolver(updateVariantSchema),
    defaultValues: {
      option1: variant.option1 ?? '',
      option2: variant.option2 ?? '',
      price: variant.price,
      sale_price: variant.sale_price ?? undefined,
      stock_quantity: variant.stock_quantity,
    },
  });

  function submit(data: UpdateVariantFormData) {
    onSave({
      option1: data.option1 || undefined,
      option2: data.option2 || undefined,
      price: data.price,
      sale_price: numOrNull(data.sale_price ?? undefined),
      stock_quantity: data.stock_quantity,
    });
  }

  return (
    <>
      <tr className="bg-teal-50/40 dark:bg-teal-500/5">
        <td className="px-6 py-3 align-top font-mono text-sm text-slate-500 dark:text-slate-400">{variant.sku}</td>
        {option1Label && (
          <td className="px-3 py-3 align-top">
            <input {...register('option1')} placeholder={option1Label} className="admin-input" />
          </td>
        )}
        {option2Label && (
          <td className="px-3 py-3 align-top">
            <input {...register('option2')} placeholder={option2Label} className="admin-input" />
          </td>
        )}
        <td className="px-3 py-3 align-top">
          <input {...register('price', { valueAsNumber: true })} type="number" step="any" className="admin-input" />
          {errors.price && <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{errors.price.message}</p>}
        </td>
        <td className="px-3 py-3 align-top">
          <input {...register('sale_price', { valueAsNumber: true })} type="number" step="any" placeholder="—" className="admin-input" />
          {errors.sale_price && <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{errors.sale_price.message}</p>}
        </td>
        <td className="px-3 py-3 align-top">
          <input {...register('stock_quantity', { valueAsNumber: true })} type="number" className="admin-input" />
          {errors.stock_quantity && <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{errors.stock_quantity.message}</p>}
        </td>
        <td className="px-6 py-3 align-top">
          <div className="flex items-center justify-end gap-1">
            <Button variant="primary" iconOnly icon={Check} aria-label="Save variant" loading={pending} onClick={handleSubmit(submit)} />
            <Button variant="ghost" iconOnly icon={X} aria-label="Cancel edit" onClick={onCancel} disabled={pending} />
          </div>
        </td>
      </tr>
      {error instanceof ApiError && (
        <tr className="bg-teal-50/40 dark:bg-teal-500/5">
          <td colSpan={colCount} className="px-6 pb-3 text-xs text-rose-600 dark:text-rose-400">{error.message}</td>
        </tr>
      )}
    </>
  );
}

function VariantAddForm({
  option1Label,
  option2Label,
  skuBase,
  addVariant,
}: {
  option1Label: string | null;
  option2Label: string | null;
  skuBase?: string;
  addVariant: AddVariantMutation;
}) {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<CreateVariantFormData>({
    resolver: zodResolver(createVariantSchema),
  });

  // Suggest a SKU from the product slug + options once options are set, unless the
  // user already typed one.
  function maybeSuggestSku() {
    if (getValues('sku')) return;
    const suggested = suggestSku(skuBase, getValues('option1') || undefined, getValues('option2') || undefined);
    if (suggested) setValue('sku', suggested, { shouldValidate: true });
  }

  function onSubmit(data: CreateVariantFormData) {
    addVariant.mutate(
      {
        ...data,
        option1: data.option1 || undefined,
        option2: data.option2 || undefined,
        sale_price: numOrNull(data.sale_price ?? undefined) ?? undefined,
      },
      { onSuccess: () => reset() },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add Variant</h4>
      {addVariant.error instanceof ApiError && (
        <div className="text-xs text-rose-600 dark:text-rose-400">{addVariant.error.message}</div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <input {...register('sku')} onFocus={maybeSuggestSku} placeholder="SKU" className="admin-input" />
          {errors.sku && <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{errors.sku.message}</p>}
        </div>
        {option1Label && <input {...register('option1', { onBlur: maybeSuggestSku })} placeholder={option1Label} className="admin-input" />}
        {option2Label && <input {...register('option2', { onBlur: maybeSuggestSku })} placeholder={option2Label} className="admin-input" />}
        <div>
          <input {...register('price', { valueAsNumber: true })} type="number" step="any" placeholder="Price" className="admin-input" />
          {errors.price && <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{errors.price.message}</p>}
        </div>
        <input {...register('sale_price', { valueAsNumber: true })} type="number" step="any" placeholder="Sale price" className="admin-input" />
        <div>
          <input {...register('stock_quantity', { valueAsNumber: true })} type="number" placeholder="Stock" className="admin-input" />
          {errors.stock_quantity && <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{errors.stock_quantity.message}</p>}
        </div>
      </div>
      <Button type="submit" loading={addVariant.isPending} size="sm" icon={Plus}>
        Add Variant
      </Button>
    </form>
  );
}
