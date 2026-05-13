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
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{address.full_name}</span>
              <span className="text-sm text-gray-500">{address.phone}</span>
              {address.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  <Star className="h-3 w-3" />
                  Default
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600">{address.address_line}</p>
            <p className="text-sm text-gray-600">{address.city}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(address)}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            disabled={isDeleting}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!address.is_default && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            disabled={isSettingDefault}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            {isSettingDefault ? 'Setting...' : 'Set as default'}
          </button>
        </div>
      )}
    </div>
  );
}
