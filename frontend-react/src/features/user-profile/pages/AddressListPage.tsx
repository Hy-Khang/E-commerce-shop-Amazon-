import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('userProfile');
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
          <div className="h-6 w-36 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="h-9 w-28 rounded bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-28 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
          <div className="h-28 rounded-xl bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-sm text-rose-800">
        {t('address.loadError')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{t('address.title')}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t('address.subtitle')}</p>
        </div>
        <Button
          type="button"
          variant="brand"
          onClick={() => setShowForm(true)}
          icon={Plus}
          className="shrink-0"
        >
          {t('address.add')}
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
        <div className="rounded-xl border-2 border-dashed border-border-default p-10 text-center bg-surface-hover/50">
          <p className="text-sm text-text-secondary">{t('address.emptyText')}</p>
          <Button
            type="button"
            variant="brand-outline"
            onClick={() => setShowForm(true)}
            className="mt-4"
          >
            {t('address.addFirst')}
          </Button>
        </div>
      )}

      {/* Drawer for creating a new address */}
      <Drawer
        open={showForm}
        onClose={() => setShowForm(false)}
        title={t('address.drawerAddTitle')}
        variant="modal"
        size="xl"
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
        title={t('address.drawerEditTitle')}
        variant="modal"
        size="xl"
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
        title={t('address.deleteTitle')}
        message={t('address.deleteMessage')}
        variant="danger"
        confirmVariant="brand"
        confirmLabel={t('address.deleteConfirm')}
        loading={deleteAddress.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

