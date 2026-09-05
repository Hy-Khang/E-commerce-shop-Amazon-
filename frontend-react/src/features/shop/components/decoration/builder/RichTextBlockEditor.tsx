import type { RichTextBlockData } from '../../../types/decoration.types';

interface Props {
  data: RichTextBlockData;
  onChange: (data: RichTextBlockData) => void;
}

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300';
const MAX_BODY = 2000;

/** Editor for a plain-text content block (portal design language). */
export function RichTextBlockEditor({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className={labelClass}>Heading</label>
        <input
          className="admin-input"
          maxLength={120}
          value={data.heading ?? ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Body</label>
        <textarea
          className="admin-input min-h-32 resize-y"
          maxLength={MAX_BODY}
          value={data.body ?? ''}
          onChange={(e) => onChange({ ...data, body: e.target.value })}
        />
        <p className="text-right text-xs text-slate-400">
          {(data.body ?? '').length}/{MAX_BODY}
        </p>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Alignment</label>
        <div className="flex gap-2">
          {(['left', 'center'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => onChange({ ...data, align })}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize transition-colors ${
                (data.align ?? 'left') === align
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
