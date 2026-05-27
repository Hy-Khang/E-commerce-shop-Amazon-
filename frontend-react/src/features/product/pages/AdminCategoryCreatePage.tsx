import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';
import { useCreateCategory } from '../hooks/useAdminCategories';
import { CategoryForm } from '../components/CategoryForm';
import type { CreateCategoryFormData } from '../types/product.types';

export default function AdminCategoryCreatePage() {
  const navigate = useNavigate();
  const createCategory = useCreateCategory();

  function onSubmit(data: CreateCategoryFormData) {
    createCategory.mutate(
      {
        name: data.name,
        slug: data.slug,
        parent_id: data.parent_id ?? undefined,
      },
      { onSuccess: () => navigate(ROUTES.ADMIN_CATEGORIES) },
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Category</h1>
        <Link to={ROUTES.ADMIN_CATEGORIES} className="text-sm text-gray-600 hover:text-gray-900">
          Back to list
        </Link>
      </div>

      <CategoryForm
        onSubmit={onSubmit}
        isPending={createCategory.isPending}
        error={createCategory.error}
        submitLabel="Create Category"
      />
    </div>
  );
}
