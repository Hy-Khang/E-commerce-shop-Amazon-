import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Drawer } from '@/common/components/ui/Drawer';
import { ApiError } from '@/core/api/api.types';
import { FlashSaleForm } from './FlashSaleForm';
import { flashSaleFormSchema, type FlashSaleFormData, type FlashSale } from '../types/flash-sale.types';

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (data: FlashSaleFormData) => void;
  isPending: boolean;
  error: Error | null;
  detail?: FlashSale | null;
  isLoadingDetail?: boolean;
  isEdit?: boolean;
}

export function FlashSaleFormModal({
  open,
  onClose,
  title,
  onSubmit,
  isPending,
  error,
  detail,
  isLoadingDetail,
  isEdit,
}: Props) {
  return (
    <Drawer open={open} onClose={onClose} title={title} variant="modal" size="lg">
      {error instanceof ApiError && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error.message}
        </div>
      )}

      {isEdit && isLoadingDetail ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
        </div>
      ) : isEdit && !detail ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Flash sale not found.
        </p>
      ) : (
        <FlashSaleFormBody detail={detail} onSubmit={onSubmit} isPending={isPending} isEdit={isEdit} />
      )}
    </Drawer>
  );
}

interface BodyProps {
  detail?: FlashSale | null;
  onSubmit: (data: FlashSaleFormData) => void;
  isPending: boolean;
  isEdit?: boolean;
}

function FlashSaleFormBody({ detail, onSubmit, isPending, isEdit }: BodyProps) {
  const form = useForm<FlashSaleFormData>({
    resolver: zodResolver(flashSaleFormSchema),
    defaultValues: detail
      ? {
          name: detail.name,
          registration_starts_at: toLocalDatetime(detail.registration_starts_at),
          registration_ends_at: toLocalDatetime(detail.registration_ends_at),
          starts_at: toLocalDatetime(detail.starts_at),
          ends_at: toLocalDatetime(detail.ends_at),
          min_discount_percent: detail.min_discount_percent,
          is_active: detail.is_active,
        }
      : {
          name: '',
          registration_starts_at: '',
          registration_ends_at: '',
          starts_at: '',
          ends_at: '',
          min_discount_percent: 0,
        },
  });

  return (
    <FlashSaleForm
      form={form}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={isEdit ? 'Save Changes' : 'Create Flash Sale'}
      isEdit={isEdit}
    />
  );
}
