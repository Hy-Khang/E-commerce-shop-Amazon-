import { type ReactNode } from 'react';
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormGetValues,
  type UseFormRegister,
  type UseFormSetValue,
} from 'react-hook-form';
import { Wand2 } from 'lucide-react';
import { RichTextEditor } from '@/common/components/ui/RichTextEditor';
import { CategoryCascader } from './CategoryCascader';
import { ImageUpload } from './ImageUpload';
import { generateSlug } from '../utils/product.util';
import type { Category, CreateProductFormData } from '../types/product.types';

interface ProductDetailsFormProps {
  register: UseFormRegister<CreateProductFormData>;
  control: Control<CreateProductFormData>;
  setValue: UseFormSetValue<CreateProductFormData>;
  getValues: UseFormGetValues<CreateProductFormData>;
  errors: FieldErrors<CreateProductFormData>;
  categories: Category[];
  /** Admin renders the shop picker here; seller passes nothing. */
  shopSlot?: ReactNode;
}

/**
 * Shared product info fields (name, slug, category, description, variant option
 * labels, thumbnail) used by the admin & seller create/edit pages. The page owns
 * the `useForm` instance + submit; this component only renders the fields.
 */
export function ProductDetailsForm({
  register,
  control,
  setValue,
  getValues,
  errors,
  categories,
  shopSlot,
}: ProductDetailsFormProps) {
  const categoryId = useWatch({ control, name: 'category_id' });
  const thumbnailUrl = useWatch({ control, name: 'thumbnail_url' });

  // Auto-fill slug from name on blur only when slug is still empty (never clobber
  // an existing slug on the edit page — changing a slug changes the public URL).
  function handleNameBlur() {
    const name = getValues('name');
    if (name && !getValues('slug')) {
      setValue('slug', generateSlug(name), { shouldValidate: true });
    }
  }

  function regenerateSlug() {
    const name = getValues('name');
    if (name) setValue('slug', generateSlug(name), { shouldValidate: true, shouldDirty: true });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input id="name" {...register('name')} onBlur={handleNameBlur} className="admin-input mt-1" />
          {errors.name && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Slug</label>
          <div className="mt-1 flex items-center gap-2">
            <input id="slug" {...register('slug')} className="admin-input" />
            <button
              type="button"
              onClick={regenerateSlug}
              title="Generate from name"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Generate
            </button>
          </div>
          {errors.slug && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.slug.message}</p>}
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Duplicates get a numeric suffix automatically on save.</p>
        </div>
      </div>

      <CategoryCascader
        categories={categories}
        value={categoryId}
        onChange={(id) => setValue('category_id', id as number, { shouldValidate: true })}
        error={errors.category_id?.message}
        leafOnly
      />

      {shopSlot}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
        <div className="mt-1">
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <RichTextEditor value={field.value ?? ''} onChange={field.onChange} />
            )}
          />
        </div>
        {errors.description && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="option1_label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variant Option 1</label>
          <input id="option1_label" {...register('option1_label')} placeholder="e.g. Color, RAM, Connectivity" className="admin-input mt-1" />
        </div>
        <div>
          <label htmlFor="option2_label" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Variant Option 2</label>
          <input id="option2_label" {...register('option2_label')} placeholder="e.g. Size, Storage, DPI" className="admin-input mt-1" />
        </div>
      </div>

      <div>
        <ImageUpload
          label="Thumbnail"
          value={thumbnailUrl || undefined}
          onUploaded={(url) => setValue('thumbnail_url', url, { shouldValidate: true })}
          onClear={() => setValue('thumbnail_url', '', { shouldValidate: true })}
        />
        {errors.thumbnail_url && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.thumbnail_url.message}</p>}
      </div>
    </div>
  );
}
