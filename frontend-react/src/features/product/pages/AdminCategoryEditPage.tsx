import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { useAdminCategory, useUpdateCategory } from '../hooks/useAdminCategories';
import { CategoryForm } from '../components/CategoryForm';
import type { CreateCategoryFormData } from '../types/product.types';

export default function AdminCategoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const categoryId = Number(id);
  const navigate = useNavigate();
  const { data: category, isLoading } = useAdminCategory(categoryId);
  const updateCategory = useUpdateCategory();

  function onSubmit(data: CreateCategoryFormData) {
    updateCategory.mutate(
      {
        id: categoryId,
        data: {
          name: data.name,
          slug: data.slug,
          parent_id: data.parent_id,
        },
      },
      { onSuccess: () => navigate(ROUTES.ADMIN_CATEGORIES) },
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!category) {
    return <div className="py-12 text-center text-slate-500">Category not found.</div>;
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

      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit: {category.name}</h1>

      {category.parent && (
        <div className="admin-card p-4">
          <h3 className="text-sm font-medium text-slate-700">Parent</h3>
          <div className="mt-2">
            <Link
              to={ROUTES.ADMIN_CATEGORY_EDIT(category.parent.id)}
              className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              {category.parent.name}
            </Link>
          </div>
        </div>
      )}

      {category.children && category.children.length > 0 && (
        <div className="admin-card p-4">
          <h3 className="text-sm font-medium text-slate-700">
            Children ({category.children.length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                to={ROUTES.ADMIN_CATEGORY_EDIT(child.id)}
                className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-slate-600">
        Products in this category: <span className="font-medium text-slate-900">{category.productCount}</span>
      </div>

      <div className="admin-card p-6">
        <CategoryForm
          key={categoryId}
          defaultValues={{
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id,
          }}
          onSubmit={onSubmit}
          isPending={updateCategory.isPending}
          error={updateCategory.error}
          submitLabel="Save Changes"
          excludeCategoryId={categoryId}
        />
      </div>
    </div>
  );
}
