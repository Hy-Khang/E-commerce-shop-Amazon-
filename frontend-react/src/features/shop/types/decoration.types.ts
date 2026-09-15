import { z } from 'zod';

/**
 * Shop Decoration block schema — the FE mirror of the backend
 * `decoration-config.dto.ts`. Keep `DECORATION_LIMITS` in sync with the BE DTO
 * limits (both are the source of truth for the same envelope).
 */

export const DECORATION_VERSION = 1;

export const BLOCK_TYPES = ['hero', 'rich_text', 'image', 'product_grid'] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const DECORATION_LIMITS = {
  MAX_BLOCKS: 20,
  HERO_MIN_IMAGES: 1,
  HERO_MAX_IMAGES: 5,
  GRID_MIN_IDS: 1,
  GRID_MAX_IDS: 12,
} as const;

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  hero: 'Hero slideshow',
  rich_text: 'Text block',
  image: 'Image banner',
  product_grid: 'Product grid',
};

// ─── Per-type data shapes ───

export interface HeroBlockData {
  images: string[];
  heading?: string;
  tagline?: string;
  cta?: { label: string; href: string };
  autoplay?: boolean;
}

export interface RichTextBlockData {
  heading?: string;
  body: string;
  align?: 'left' | 'center';
}

export interface ImageBlockData {
  url: string;
  alt?: string;
  href?: string;
  ratio?: 'wide' | 'square' | 'tall';
}

export interface ProductGridBlockData {
  title?: string;
  product_ids: number[];
  columns?: 2 | 3 | 4;
}

export interface BlockDataMap {
  hero: HeroBlockData;
  rich_text: RichTextBlockData;
  image: ImageBlockData;
  product_grid: ProductGridBlockData;
}

export interface Block<T extends BlockType = BlockType> {
  id: string;
  type: T;
  data: BlockDataMap[T];
}

export type AnyBlock = { [T in BlockType]: Block<T> }[BlockType];

export interface DecorationTheme {
  accent?: string;
}

export interface DecorationConfig {
  version: number;
  theme?: DecorationTheme;
  blocks: AnyBlock[];
}

// ─── Zod schemas (validate before save; also used to guard-parse on render) ───

const hexColorSchema = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex color like #22c55e');

const ctaSchema = z.object({
  label: z.string().max(40),
  href: z.string().max(500),
});

const heroDataSchema = z.object({
  images: z
    .array(z.string().max(500))
    .min(DECORATION_LIMITS.HERO_MIN_IMAGES)
    .max(DECORATION_LIMITS.HERO_MAX_IMAGES),
  heading: z.string().max(80).optional(),
  tagline: z.string().max(160).optional(),
  cta: ctaSchema.optional(),
  autoplay: z.boolean().optional(),
});

const richTextDataSchema = z.object({
  heading: z.string().max(120).optional(),
  body: z.string().max(2000),
  align: z.enum(['left', 'center']).optional(),
});

const imageDataSchema = z.object({
  url: z.string().max(500),
  alt: z.string().max(120).optional(),
  href: z.string().max(500).optional(),
  ratio: z.enum(['wide', 'square', 'tall']).optional(),
});

const productGridDataSchema = z.object({
  title: z.string().max(80).optional(),
  product_ids: z
    .array(z.number().int().positive())
    .min(DECORATION_LIMITS.GRID_MIN_IDS)
    .max(DECORATION_LIMITS.GRID_MAX_IDS)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'product ids must be unique',
    }),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
});

const blockSchema = z.discriminatedUnion('type', [
  z.object({ id: z.string().min(6).max(40), type: z.literal('hero'), data: heroDataSchema }),
  z.object({ id: z.string().min(6).max(40), type: z.literal('rich_text'), data: richTextDataSchema }),
  z.object({ id: z.string().min(6).max(40), type: z.literal('image'), data: imageDataSchema }),
  z.object({
    id: z.string().min(6).max(40),
    type: z.literal('product_grid'),
    data: productGridDataSchema,
  }),
]);

export const decorationConfigSchema = z.object({
  version: z.literal(DECORATION_VERSION),
  theme: z.object({ accent: hexColorSchema.optional() }).optional(),
  blocks: z
    .array(blockSchema)
    .max(DECORATION_LIMITS.MAX_BLOCKS)
    .refine((blocks) => new Set(blocks.map((b) => b.id)).size === blocks.length, {
      message: 'block ids must be unique',
    }),
});

/**
 * Guard-parse an unknown decoration_config (from the API) into a valid config,
 * or null. Resilient by design: a malformed/legacy envelope degrades to null so
 * the shop page falls back to the default layout instead of crashing.
 */
export function parseDecorationConfig(value: unknown): DecorationConfig | null {
  if (value == null) return null;
  const result = decorationConfigSchema.safeParse(value);
  return result.success ? (result.data as DecorationConfig) : null;
}
