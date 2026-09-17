import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Check, Pencil, X, ZoomIn } from 'lucide-react';
import { Button } from '@/common/components/ui/Button';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { ImageLightbox } from '@/common/components/ui/ImageLightbox';
import { getImageUrl } from '@/common/utils/format.util';
import { getUniqueOptionValues } from '../utils/product.util';
import { ImageUpload } from './ImageUpload';
import type {
  CreateImageRequest,
  ProductImage,
  ProductVariant,
  UpdateImageRequest,
} from '../types/product.types';

/** Minimal shapes of the TanStack mutation results the page passes in (structurally compatible). */
interface AddImageMutation {
  mutate: (data: CreateImageRequest, options?: { onSuccess?: () => void }) => void;
  isPending: boolean;
}
interface UpdateImageMutation {
  mutate: (
    vars: { imageId: number; data: UpdateImageRequest },
    options?: { onSuccess?: () => void },
  ) => void;
  isPending: boolean;
}
interface DeleteImageMutation {
  mutate: (imageId: number) => void;
  isPending: boolean;
}

interface ImagesManagerProps {
  images: ProductImage[];
  variants: ProductVariant[];
  option1Label: string | null;
  addImage: AddImageMutation;
  updateImage: UpdateImageMutation;
  deleteImage: DeleteImageMutation;
}

/** Stable order: by sort_order, then id, so equal sort_orders don't jump around. */
function bySortThenId(a: ProductImage, b: ProductImage): number {
  return a.sort_order - b.sort_order || a.id - b.id;
}

export function ImagesManager({
  images,
  variants,
  option1Label,
  addImage,
  updateImage,
  deleteImage,
}: ImagesManagerProps) {
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);

  const option1Values = option1Label ? getUniqueOptionValues(variants, 'option1') : [];
  const sorted = [...images].sort(bySortThenId);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Images ({images.length})</h2>

      {editing && (
        <ImageEditPanel
          key={editing.id}
          image={editing}
          option1Label={option1Label}
          option1Values={option1Values}
          pending={updateImage.isPending}
          replacing={addImage.isPending || deleteImage.isPending}
          onCancel={() => setEditing(null)}
          onSave={(data) =>
            updateImage.mutate({ imageId: editing.id, data }, { onSuccess: () => setEditing(null) })
          }
          onReplace={(newUrl) => {
            const target = editing;
            addImage.mutate(
              {
                image_url: newUrl,
                sort_order: target.sort_order,
                ...(target.variant_option1 ? { variant_option1: target.variant_option1 } : {}),
              },
              {
                onSuccess: () => {
                  deleteImage.mutate(target.id);
                  setEditing(null);
                },
              },
            );
          }}
        />
      )}

      {sorted.length > 0 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {sorted.map((img) => (
            <div
              key={img.id}
              className={`group relative overflow-hidden rounded-lg ring-1 dark:ring-white/10 ${
                editing?.id === img.id ? 'ring-2 ring-teal-500' : 'ring-slate-900/5'
              }`}
            >
              <button
                type="button"
                onClick={() => setZoomSrc(getImageUrl(img.image_url))}
                className="block w-full cursor-zoom-in"
                aria-label="Zoom image"
              >
                <img src={getImageUrl(img.image_url)} alt="" className="aspect-square w-full object-cover" />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <ZoomIn className="h-5 w-5 text-white" />
                </span>
              </button>
              <div className="absolute right-1 top-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setEditing(img)}
                  className="rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900/90"
                  aria-label="Edit image"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(img)}
                  disabled={deleteImage.isPending}
                  className="rounded-full bg-slate-900/70 p-1 text-white hover:bg-rose-600"
                  aria-label="Delete image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center gap-1 bg-slate-900/60 px-1.5 py-0.5">
                <span className="text-xs text-white">#{img.sort_order}</span>
                {img.variant_option1 && (
                  <span className="rounded bg-sky-500/80 px-1 text-[10px] font-medium text-white">{img.variant_option1}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ImageAddForm
        option1Label={option1Label}
        option1Values={option1Values}
        addImage={addImage}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete image"
        message="Delete this image? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteImage.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteImage.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <ImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />
    </section>
  );
}

function ImageEditPanel({
  image,
  option1Label,
  option1Values,
  pending,
  replacing,
  onCancel,
  onSave,
  onReplace,
}: {
  image: ProductImage;
  option1Label: string | null;
  option1Values: string[];
  pending: boolean;
  replacing: boolean;
  onCancel: () => void;
  onSave: (data: UpdateImageRequest) => void;
  onReplace: (newUrl: string) => void;
}) {
  const [sortOrder, setSortOrder] = useState<number>(image.sort_order);
  const [variantOption1, setVariantOption1] = useState<string>(image.variant_option1 ?? '');

  return (
    <div className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <div className="flex flex-wrap items-end gap-3">
        <img src={getImageUrl(image.image_url)} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-slate-900/5 dark:ring-white/10" />
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400">Sort order</label>
          <input
            type="number"
            value={Number.isNaN(sortOrder) ? '' : sortOrder}
            onChange={(e) => setSortOrder(e.target.valueAsNumber)}
            className="admin-input w-24"
          />
        </div>
        {option1Values.length > 0 && (
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400">{option1Label}</label>
            <select value={variantOption1} onChange={(e) => setVariantOption1(e.target.value)} className="admin-input">
              <option value="">Shared (all variants)</option>
              {option1Values.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        )}
        <Button
          icon={Check}
          size="sm"
          loading={pending}
          disabled={replacing}
          onClick={() =>
            onSave({
              sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
              variant_option1: variantOption1 || null,
            })
          }
        >
          Save
        </Button>
        <Button variant="ghost" icon={X} size="sm" onClick={onCancel} disabled={pending || replacing}>
          Cancel
        </Button>
      </div>
      <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          Replace image — upload a new file (keeps the sort order &amp; variant tag above).
        </p>
        <ImageUpload label="" onUploaded={onReplace} />
      </div>
    </div>
  );
}

function ImageAddForm({
  option1Label,
  option1Values,
  addImage,
}: {
  option1Label: string | null;
  option1Values: string[];
  addImage: AddImageMutation;
}) {
  const { register, handleSubmit, reset, setValue, control } = useForm<{
    image_url: string;
    sort_order: number;
    variant_option1: string;
  }>({
    defaultValues: { image_url: '', sort_order: 0, variant_option1: '' },
  });

  const imageUrl = useWatch({ control, name: 'image_url' });

  function onSubmit(data: { image_url: string; sort_order: number; variant_option1: string }) {
    if (!data.image_url) return;
    addImage.mutate(
      {
        image_url: data.image_url,
        sort_order: data.sort_order,
        ...(data.variant_option1 ? { variant_option1: data.variant_option1 } : {}),
      },
      { onSuccess: () => reset() },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
      <ImageUpload
        label="Gallery Image"
        value={imageUrl || undefined}
        onUploaded={(url) => setValue('image_url', url)}
        onClear={() => setValue('image_url', '')}
      />
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400">Sort order</label>
          <input {...register('sort_order', { valueAsNumber: true })} type="number" className="admin-input w-20" />
        </div>
        {option1Values.length > 0 && (
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400">{option1Label}</label>
            <select {...register('variant_option1')} className="admin-input">
              <option value="">Shared (all variants)</option>
              {option1Values.map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        )}
        <Button type="submit" loading={addImage.isPending} size="sm" disabled={!imageUrl}>
          Add Image
        </Button>
      </div>
    </form>
  );
}
