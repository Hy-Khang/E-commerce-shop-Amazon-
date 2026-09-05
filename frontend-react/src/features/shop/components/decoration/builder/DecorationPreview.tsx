import type { DecorationConfig } from '../../../types/decoration.types';
import { ShopDecorationRenderer } from '../ShopDecorationRenderer';

interface Props {
  config: DecorationConfig;
}

/**
 * Live preview of the decoration being edited. Renders the exact same storefront
 * block components (single source of truth) inside a framed viewport, so the
 * seller sees what shoppers will see. The frame is portal-styled; its inner
 * content uses storefront semantic tokens (via the shared renderer).
 */
export function DecorationPreview({ config }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-400">Storefront preview</span>
      </div>
      <div className="max-h-[70vh] overflow-y-auto bg-page p-4">
        {config.blocks.length === 0 ? (
          <p className="py-16 text-center text-sm text-text-secondary">
            Your decoration preview will appear here.
          </p>
        ) : (
          <ShopDecorationRenderer config={config} />
        )}
      </div>
    </div>
  );
}
