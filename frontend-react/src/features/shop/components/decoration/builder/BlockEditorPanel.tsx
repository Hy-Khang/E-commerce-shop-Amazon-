import type { AnyBlock, BlockDataMap } from '../../../types/decoration.types';
import { BLOCK_TYPE_LABELS } from '../../../types/decoration.types';
import { HeroBlockEditor } from './HeroBlockEditor';
import { RichTextBlockEditor } from './RichTextBlockEditor';
import { ImageBlockEditor } from './ImageBlockEditor';
import { ProductGridBlockEditor } from './ProductGridBlockEditor';

interface Props {
  block: AnyBlock | null;
  onChange: (block: AnyBlock) => void;
}

/** Dispatches to the per-type editor for the selected block. */
export function BlockEditorPanel({ block, onChange }: Props) {
  if (!block) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400 dark:border-slate-800">
        Select a block to edit it, or add one from the left.
      </div>
    );
  }

  // Each branch narrows `block` so the editor gets its exact data type; the
  // `onChange` re-wraps the new data with the block's id + type.
  const update = <T extends AnyBlock>(b: T, data: T['data']): void =>
    onChange({ ...b, data } as AnyBlock);

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        {BLOCK_TYPE_LABELS[block.type]}
      </h3>
      {block.type === 'hero' && (
        <HeroBlockEditor
          data={block.data}
          onChange={(data: BlockDataMap['hero']) => update(block, data)}
        />
      )}
      {block.type === 'rich_text' && (
        <RichTextBlockEditor
          data={block.data}
          onChange={(data: BlockDataMap['rich_text']) => update(block, data)}
        />
      )}
      {block.type === 'image' && (
        <ImageBlockEditor
          data={block.data}
          onChange={(data: BlockDataMap['image']) => update(block, data)}
        />
      )}
      {block.type === 'product_grid' && (
        <ProductGridBlockEditor
          data={block.data}
          onChange={(data: BlockDataMap['product_grid']) => update(block, data)}
        />
      )}
    </div>
  );
}
