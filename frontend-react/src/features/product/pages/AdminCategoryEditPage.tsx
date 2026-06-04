import { useParams, Link, useNavigate } from 'react-router-dom';
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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-64 rounded bg-gray-200" />
      </div>
    );
  }

  if (!category) {
    return <div className="py-12 text-center text-gray-500">Category not found.</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit: {category.name}</h1>
        <Link to={ROUTES.ADMIN_CATEGORIES} className="text-sm text-gray-600 hover:text-gray-900">
          Back to list
        </Link>
      </div>

      {category.parent && (
        <div className="rounded-md border bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700">Parent</h3>
          <div className="mt-2">
            <Link
              to={ROUTES.ADMIN_CATEGORY_EDIT(category.parent.id)}
              className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border hover:bg-gray-100"
            >
              {category.parent.name}
            </Link>
          </div>
        </div>
      )}

      {category.children && category.children.length > 0 && (
        <div className="rounded-md border bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-700">
            Children ({category.children.length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                to={ROUTES.ADMIN_CATEGORY_EDIT(child.id)}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 border hover:bg-gray-100"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        Products in this category: <span className="font-medium">{category.productCount}</span>
      </div>

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
  );
}
