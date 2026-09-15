import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import {
  BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  DECORATION_LIMITS,
  type AnyBlock,
  type BlockType,
} from '../../../types/decoration.types';

interface Props {
  blocks: AnyBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (type: BlockType) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}

/**
 * The left rail of the builder: an "add block" palette plus the ordered block
 * list. Reordering baseline is up/down arrow buttons (always reliable + a11y /
 * touch friendly). Portal design language (slate/amber + dark).
 */
export function BlockListEditor({
  blocks,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  onMove,
}: Props) {
  const atLimit = blocks.length >= DECORATION_LIMITS.MAX_BLOCKS;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Add block
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              disabled={atLimit}
              onClick={() => onAdd(type)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors hover:border-amber-400 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-500 dark:hover:bg-amber-500/10"
            >
              <Plus className="h-3.5 w-3.5" />
              {BLOCK_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {atLimit && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
            Maximum {DECORATION_LIMITS.MAX_BLOCKS} blocks reached.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Layout ({blocks.length})
        </h3>
        {blocks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-800">
            No blocks yet. Add one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((block, index) => {
              const selected = block.id === selectedId;
              return (
                <li
                  key={block.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm transition-colors ${
                    selected
                      ? 'border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-500/10'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                  }`}
                >
                  <GripVertical className="h-4 w-4 flex-shrink-0 text-slate-300 dark:text-slate-600" />
                  <button
                    type="button"
                    onClick={() => onSelect(block.id)}
                    className="flex-1 truncate text-left text-slate-700 dark:text-slate-300"
                  >
                    {BLOCK_TYPE_LABELS[block.type]}
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => onMove(index, -1)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      disabled={index === blocks.length - 1}
                      onClick={() => onMove(index, 1)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete block"
                      onClick={() => onRemove(block.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
