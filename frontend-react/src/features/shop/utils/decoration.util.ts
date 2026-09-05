import {
  type AnyBlock,
  type BlockType,
  type DecorationConfig,
  DECORATION_VERSION,
} from '../types/decoration.types';

/** A fresh, schema-valid block id (6–40 chars). */
export function newBlockId(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `blk_${rand}`;
}

/** Build a new block of `type` with sensible, schema-valid defaults. */
export function createBlock(type: BlockType): AnyBlock {
  const id = newBlockId();
  switch (type) {
    case 'hero':
      return { id, type, data: { images: [], heading: '', tagline: '', autoplay: true } };
    case 'rich_text':
      return { id, type, data: { heading: '', body: '', align: 'left' } };
    case 'image':
      return { id, type, data: { url: '', alt: '', ratio: 'wide' } };
    case 'product_grid':
      return { id, type, data: { title: '', product_ids: [], columns: 4 } };
  }
}

/** An empty config seed for a shop that has never been decorated. */
export function emptyDecorationConfig(): DecorationConfig {
  return { version: DECORATION_VERSION, blocks: [] };
}

/** Immutably move a block up/down within the list. */
export function moveBlock(
  blocks: AnyBlock[],
  index: number,
  direction: -1 | 1,
): AnyBlock[] {
  const target = index + direction;
  if (target < 0 || target >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
