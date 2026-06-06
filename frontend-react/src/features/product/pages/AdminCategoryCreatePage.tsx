import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
      <Link
        to={ROUTES.ADMIN_CATEGORIES}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Categories
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Category</h1>

      <div className="admin-card p-6">
        <CategoryForm
          onSubmit={onSubmit}
          isPending={createCategory.isPending}
          error={createCategory.error}
          submitLabel="Create Category"
        />
      </div>
    </div>
  );
}
