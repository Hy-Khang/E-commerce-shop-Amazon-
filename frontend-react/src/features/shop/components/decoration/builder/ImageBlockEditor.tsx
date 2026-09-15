import { ImageUpload } from '@/features/product';
import type { ImageBlockData } from '../../../types/decoration.types';

interface Props {
  data: ImageBlockData;
  onChange: (data: ImageBlockData) => void;
}

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300';
const RATIOS: NonNullable<ImageBlockData['ratio']>[] = ['wide', 'square', 'tall'];

/** Editor for a single image banner block (portal design language). */
export function ImageBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className={labelClass}>Image</span>
        <ImageUpload
          value={data.url || undefined}
          onUploaded={(url) => onChange({ ...data, url })}
          onClear={() => onChange({ ...data, url: '' })}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Alt text</label>
        <input
          className="admin-input"
          maxLength={120}
          value={data.alt ?? ''}
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Link (optional)</label>
        <input
          className="admin-input"
          maxLength={500}
          placeholder="/products?..."
          value={data.href ?? ''}
          onChange={(e) => onChange({ ...data, href: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Aspect ratio</label>
        <div className="flex gap-2">
          {RATIOS.map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => onChange({ ...data, ratio })}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                (data.ratio ?? 'wide') === ratio
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
