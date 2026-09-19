import type { CSSProperties } from 'react';
import {
  DECORATION_VERSION,
  type AnyBlock,
  type BlockType,
  type DecorationConfig,
  type DecorationRenderContext,
} from '../../types/decoration.types';
import { BlockErrorBoundary } from './BlockErrorBoundary';
import { HeroBlock } from './blocks/HeroBlock';
import { RichTextBlock } from './blocks/RichTextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { ProductGridBlock } from './blocks/ProductGridBlock';
import { BestSellersBlock } from './blocks/BestSellersBlock';

interface Props {
  config: DecorationConfig;
  /** Shop id + preview flag threaded to blocks that need them (best_sellers, previews). */
  context?: DecorationRenderContext;
}

/** Registry: block type → renderer. An unknown type is skipped (resilience). */
const BLOCK_RENDERERS: {
  [T in BlockType]: (
    block: Extract<AnyBlock, { type: T }>,
    ctx: DecorationRenderContext,
  ) => React.ReactNode;
} = {
  hero: (block, ctx) => <HeroBlock data={block.data} preview={ctx.preview} />,
  rich_text: (block) => <RichTextBlock data={block.data} />,
  image: (block, ctx) => <ImageBlock data={block.data} preview={ctx.preview} />,
  product_grid: (block, ctx) => <ProductGridBlock data={block.data} preview={ctx.preview} />,
  best_sellers: (block, ctx) => (
    <BestSellersBlock data={block.data} shopId={ctx.shopId} preview={ctx.preview} />
  ),
};

function renderBlock(block: AnyBlock, ctx: DecorationRenderContext): React.ReactNode {
  const renderer = BLOCK_RENDERERS[block.type] as
    | ((b: AnyBlock, c: DecorationRenderContext) => React.ReactNode)
    | undefined;
  return renderer ? renderer(block, ctx) : null;
}

/**
 * Renders a shop's decoration config as a stack of blocks. Registry-driven and
 * version-gated — an unknown version or unknown block type is skipped, and each
 * block is isolated in an error boundary so one bad block never blanks the page.
 * The theme accent is applied via a scoped CSS variable (`--shop-accent`).
 */
export function ShopDecorationRenderer({ config, context = {} }: Props) {
  if (config.version !== DECORATION_VERSION) return null;
  if (!config.blocks || config.blocks.length === 0) return null;

  const style = config.theme?.accent
    ? ({ '--shop-accent': config.theme.accent } as CSSProperties)
    : undefined;

  return (
    <div className="space-y-8" style={style}>
      {config.blocks.map((block) => {
        const rendered = renderBlock(block, context);
        if (!rendered) return null;
        return <BlockErrorBoundary key={block.id}>{rendered}</BlockErrorBoundary>;
      })}
    </div>
  );
}
