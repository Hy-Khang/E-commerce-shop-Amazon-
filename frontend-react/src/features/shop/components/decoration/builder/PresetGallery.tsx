import { useState } from 'react';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { DECORATION_PRESETS, type DecorationPreset } from '../../../utils/decoration-presets';
import type { DecorationConfig } from '../../../types/decoration.types';

interface Props {
  /** Whether the current layout has blocks — applying a preset replaces them. */
  hasBlocks: boolean;
  onApply: (config: DecorationConfig) => void;
}

/**
 * A grid of one-click starting layouts. Applying a preset replaces the current
 * blocks, so when the layout is non-empty a confirm dialog guards the swap.
 * Portal design language (slate/amber + dark).
 */
export function PresetGallery({ hasBlocks, onApply }: Props) {
  const [pending, setPending] = useState<DecorationPreset | null>(null);

  const choose = (preset: DecorationPreset) => {
    if (hasBlocks) {
      setPending(preset);
    } else {
      onApply(preset.build());
    }
  };

  const confirm = () => {
    if (pending) onApply(pending.build());
    setPending(null);
  };

  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Quick-start templates
      </h3>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Apply a ready-made layout, then tweak it. This replaces your current blocks.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {DECORATION_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => choose(preset)}
              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500 dark:hover:bg-amber-500/10"
            >
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {preset.name}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {preset.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ConfirmModal
        open={pending !== null}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
        title="Replace your current layout?"
        message={
          pending
            ? `Applying "${pending.name}" will replace your current blocks. You can still Save to keep or edit afterward.`
            : ''
        }
        confirmLabel="Apply template"
        variant="warning"
      />
    </div>
  );
}
