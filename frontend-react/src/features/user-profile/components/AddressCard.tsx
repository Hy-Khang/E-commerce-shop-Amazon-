import { MapPin, Star, Pencil, Trash2 } from 'lucide-react';
import type { Address } from '../types/user-profile.types';

interface Props {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
  isDeleting: boolean;
  isSettingDefault: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting,
  isSettingDefault,
}: Props) {
  return (
    <div className={`shop-card p-5 relative overflow-hidden transition-all duration-200 hover:border-border-brand ${address.is_default ? 'ring-2 ring-brand/10 border-border-brand' : 'hover:shadow-sm'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${address.is_default ? 'bg-brand-light text-text-brand' : 'bg-neutral-100 text-text-secondary'}`}>
            <MapPin className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-text-primary text-sm">{address.full_name}</span>
              <span className="text-xs text-text-secondary">{address.phone}</span>
              {address.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-light border border-brand/15 px-2 py-0.5 text-[10px] font-bold text-text-brand uppercase tracking-wider">
                  <Star className="h-3 w-3 fill-current" />
                  Default
                </span>
              )}
            </div>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{address.address_line}</p>
            <p className="text-xs text-text-muted mt-0.5">{address.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(address)}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
            title="Edit Address"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={isDeleting}
            className="rounded-lg p-2 text-text-muted hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
            title="Delete Address"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!address.is_default && (
        <div className="mt-4 border-t border-border-default pt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            disabled={isSettingDefault}
            className="text-xs font-semibold text-text-brand hover:text-brand-hover hover:underline transition-colors disabled:opacity-50"
          >
            {isSettingDefault ? 'Setting as default...' : 'Set as default address'}
          </button>
        </div>
      )}
    </div>
  );
}

