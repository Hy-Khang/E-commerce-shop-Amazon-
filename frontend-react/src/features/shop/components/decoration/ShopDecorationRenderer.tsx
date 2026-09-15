import type { CSSProperties } from 'react';
import {
  DECORATION_VERSION,
  type AnyBlock,
  type BlockType,
  type DecorationConfig,
} from '../../types/decoration.types';
import { BlockErrorBoundary } from './BlockErrorBoundary';
import { HeroBlock } from './blocks/HeroBlock';
import { RichTextBlock } from './blocks/RichTextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { ProductGridBlock } from './blocks/ProductGridBlock';

interface Props {
  config: DecorationConfig;
}

/** Registry: block type → renderer. An unknown type is skipped (resilience). */
const BLOCK_RENDERERS: {
  [T in BlockType]: (block: Extract<AnyBlock, { type: T }>) => React.ReactNode;
} = {
  hero: (block) => <HeroBlock data={block.data} />,
  rich_text: (block) => <RichTextBlock data={block.data} />,
  image: (block) => <ImageBlock data={block.data} />,
  product_grid: (block) => <ProductGridBlock data={block.data} />,
};

function renderBlock(block: AnyBlock): React.ReactNode {
  const renderer = BLOCK_RENDERERS[block.type] as
    | ((b: AnyBlock) => React.ReactNode)
    | undefined;
  return renderer ? renderer(block) : null;
}

/**
 * Renders a shop's decoration config as a stack of blocks. Registry-driven and
 * version-gated — an unknown version or unknown block type is skipped, and each
 * block is isolated in an error boundary so one bad block never blanks the page.
 * The theme accent is applied via a scoped CSS variable (`--shop-accent`).
 */
export function ShopDecorationRenderer({ config }: Props) {
  if (config.version !== DECORATION_VERSION) return null;
  if (!config.blocks || config.blocks.length === 0) return null;

  const style = config.theme?.accent
    ? ({ '--shop-accent': config.theme.accent } as CSSProperties)
    : undefined;

  return (
    <div className="space-y-8" style={style}>
      {config.blocks.map((block) => {
        const rendered = renderBlock(block);
        if (!rendered) return null;
        return <BlockErrorBoundary key={block.id}>{rendered}</BlockErrorBoundary>;
      })}
    </div>
  );
}
