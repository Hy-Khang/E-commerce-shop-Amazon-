import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import { useAddresses } from '../hooks/useAddresses';
import { useCreateAddress } from '../hooks/useCreateAddress';
import { useUpdateAddress } from '../hooks/useUpdateAddress';
import { useDeleteAddress } from '../hooks/useDeleteAddress';
import { useSetDefaultAddress } from '../hooks/useSetDefaultAddress';
import { AddressCard } from '../components/AddressCard';
import { AddressForm } from '../components/AddressForm';
import type { Address, AddressFormData } from '../types/user-profile.types';
import { ROUTES } from '@/common/constants/routes';

export default function AddressListPage() {
  const { data: addresses, isLoading, error: fetchError } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();

  function handleCreate(data: AddressFormData) {
    createAddress.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  }

  function handleUpdate(data: AddressFormData) {
    if (!editingAddress) return;
    updateAddress.mutate(
      { id: editingAddress.id, data },
      {
        onSuccess: () => {
          setEditingAddress(undefined);
        },
      },
    );
  }

  function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this address?')) return;
    deleteAddress.mutate(id);
  }

  function handleSetDefault(id: number) {
    setDefaultAddress.mutate(id);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-32 rounded-lg bg-gray-200" />
          <div className="h-32 rounded-lg bg-gray-200" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          Failed to load addresses. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        to={ROUTES.PROFILE}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Profile
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Shipping Addresses</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Address
        </button>
      </div>

      {addresses && addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={setEditingAddress}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
              isDeleting={deleteAddress.isPending && deleteAddress.variables === address.id}
              isSettingDefault={
                setDefaultAddress.isPending && setDefaultAddress.variables === address.id
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">No addresses yet</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Add your first address
          </button>
        </div>
      )}

      {showForm && (
        <AddressForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isPending={createAddress.isPending}
          error={createAddress.error}
        />
      )}

      {editingAddress && (
        <AddressForm
          address={editingAddress}
          onSubmit={handleUpdate}
          onClose={() => setEditingAddress(undefined)}
          isPending={updateAddress.isPending}
          error={updateAddress.error}
        />
      )}
    </div>
  );
}
