import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAddresses } from '../hooks/useAddresses';
import { useCreateAddress } from '../hooks/useCreateAddress';
import { useUpdateAddress } from '../hooks/useUpdateAddress';
import { useDeleteAddress } from '../hooks/useDeleteAddress';
import { useSetDefaultAddress } from '../hooks/useSetDefaultAddress';
import { AddressCard } from '../components/AddressCard';
import { AddressForm } from '../components/AddressForm';
import type { Address, AddressFormData } from '../types/user-profile.types';
import { Button } from '@/common/components/ui/Button';
import { Drawer } from '@/common/components/ui/Drawer';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';

export default function AddressListPage() {
  const { data: addresses, isLoading, error: fetchError } = useAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const setDefaultAddress = useSetDefaultAddress();

  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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

  function handleDeleteClick(id: number) {
    setDeleteTargetId(id);
  }

  function handleConfirmDelete() {
    if (deleteTargetId !== null) {
      deleteAddress.mutate(deleteTargetId, {
        onSuccess: () => {
          setDeleteTargetId(null);
        },
      });
    }
  }

  function handleSetDefault(id: number) {
    setDefaultAddress.mutate(id);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 rounded bg-slate-100 animate-pulse" />
          <div className="h-9 w-28 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-28 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800">
        Failed to load addresses. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">Shipping Addresses</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage your delivery addresses for a faster checkout.</p>
        </div>
        <Button
          type="button"
          variant="brand"
          onClick={() => setShowForm(true)}
          icon={Plus}
          className="shrink-0"
        >
          Add Address
        </Button>
      </div>

      {addresses && addresses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={setEditingAddress}
              onDelete={handleDeleteClick}
              onSetDefault={handleSetDefault}
              isDeleting={deleteAddress.isPending && deleteAddress.variables === address.id}
              isSettingDefault={
                setDefaultAddress.isPending && setDefaultAddress.variables === address.id
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-border-default p-10 text-center bg-neutral-50/50">
          <p className="text-sm text-text-secondary">You haven't added any shipping addresses yet.</p>
          <Button
            type="button"
            variant="brand-outline"
            onClick={() => setShowForm(true)}
            className="mt-4"
          >
            Add your first address
          </Button>
        </div>
      )}

      {/* Drawer for creating a new address */}
      <Drawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Add New Address"
      >
        <AddressForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isPending={createAddress.isPending}
          error={createAddress.error}
        />
      </Drawer>

      {/* Drawer for editing an address */}
      <Drawer
        open={!!editingAddress}
        onClose={() => setEditingAddress(undefined)}
        title="Edit Address"
      >
        {editingAddress && (
          <AddressForm
            address={editingAddress}
            onSubmit={handleUpdate}
            onClose={() => setEditingAddress(undefined)}
            isPending={updateAddress.isPending}
            error={updateAddress.error}
          />
        )}
      </Drawer>

      {/* Premium Confirm Modal for Address Deletion */}
      <ConfirmModal
        open={deleteTargetId !== null}
        title="Delete Shipping Address"
        message="Are you sure you want to delete this shipping address? This will remove it from your saved addresses."
        variant="danger"
        confirmVariant="brand"
        confirmLabel="Delete"
        loading={deleteAddress.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

