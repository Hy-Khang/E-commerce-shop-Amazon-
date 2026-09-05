import { X } from 'lucide-react';
import { ImageUpload } from '@/features/product';
import { DECORATION_LIMITS, type HeroBlockData } from '../../../types/decoration.types';

interface Props {
  data: HeroBlockData;
  onChange: (data: HeroBlockData) => void;
}

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

/** Editor for a hero slideshow block (portal design language). */
export function HeroBlockEditor({ data, onChange }: Props) {
  const images = data.images ?? [];
  const canAddImage = images.length < DECORATION_LIMITS.HERO_MAX_IMAGES;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className={labelClass}>
          Images ({images.length}/{DECORATION_LIMITS.HERO_MAX_IMAGES})
        </span>
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative">
              <img
                src={url}
                alt=""
                className="h-24 w-40 rounded-lg object-cover ring-1 ring-slate-900/5 dark:ring-white/10"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange({ ...data, images: images.filter((_, j) => j !== i) })}
                className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-0.5 text-white shadow hover:bg-rose-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {canAddImage && (
          <ImageUpload onUploaded={(url) => onChange({ ...data, images: [...images, url] })} />
        )}
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Heading</label>
        <input
          className="admin-input"
          maxLength={80}
          value={data.heading ?? ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Tagline</label>
        <input
          className="admin-input"
          maxLength={160}
          value={data.tagline ?? ''}
          onChange={(e) => onChange({ ...data, tagline: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={labelClass}>Button label</label>
          <input
            className="admin-input"
            maxLength={40}
            value={data.cta?.label ?? ''}
            onChange={(e) => {
              const label = e.target.value;
              const href = data.cta?.href ?? '';
              onChange({ ...data, cta: label || href ? { label, href } : undefined });
            }}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Button link</label>
          <input
            className="admin-input"
            maxLength={500}
            placeholder="/products?..."
            value={data.cta?.href ?? ''}
            onChange={(e) => {
              const href = e.target.value;
              const label = data.cta?.label ?? '';
              onChange({ ...data, cta: label || href ? { label, href } : undefined });
            }}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={data.autoplay !== false}
          onChange={(e) => onChange({ ...data, autoplay: e.target.checked })}
        />
        Auto-advance slides
      </label>
    </div>
  );
}
