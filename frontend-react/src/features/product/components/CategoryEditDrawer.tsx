import { Loader2 } from 'lucide-react';
import { Drawer } from '@/common/components/ui/Drawer';
import { CategoryForm } from './CategoryForm';
import { useAdminCategory, useUpdateCategory } from '../hooks/useAdminCategories';
import type { CreateCategoryFormData } from '../types/product.types';

interface Props {
  editId: number | null;
  onClose: () => void;
}

export function CategoryEditDrawer({ editId, onClose }: Props) {
  const { data: category, isLoading } = useAdminCategory(editId ?? 0);
  const updateCategory = useUpdateCategory();

  function handleClose() {
    updateCategory.reset();
    onClose();
  }

  function handleUpdate(data: CreateCategoryFormData) {
    if (editId === null) return;
    updateCategory.mutate(
      {
        id: editId,
        data: {
          name: data.name,
          slug: data.slug,
          parent_id: data.parent_id,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Drawer
      open={editId !== null}
      onClose={handleClose}
      title="Edit Category"
      variant="modal"
      size="lg"
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : !category ? (
        <p className="py-10 text-center text-sm text-slate-500">Category not found.</p>
      ) : (
        <CategoryForm
          key={editId}
          defaultValues={{
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id,
          }}
          onSubmit={handleUpdate}
          isPending={updateCategory.isPending}
          error={updateCategory.error}
          submitLabel="Save Changes"
          excludeCategoryId={editId ?? undefined}
        />
      )}
    </Drawer>
  );
}
