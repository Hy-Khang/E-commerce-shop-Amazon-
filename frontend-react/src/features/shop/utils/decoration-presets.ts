import { BookOpen, Flame, Hand, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react';
import { DECORATION_VERSION, type DecorationConfig } from '../types/decoration.types';
import { newBlockId } from './decoration.util';

/**
 * Ready-made storefront layouts a seller can apply in one click. Each `build()`
 * returns a fresh, schema-valid config (new block ids every time) so it passes
 * `decorationConfigSchema` and can be saved immediately, then tweaked.
 *
 * Design note: templates favor the auto `best_sellers` block over `product_grid`
 * because a grid needs ≥1 pinned product to validate — best_sellers fills itself,
 * so every preset is savable out of the box. Placeholder images point at bundled
 * `/images/products/*` files (sellers swap them for their own).
 */
export interface DecorationPreset {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  build: () => DecorationConfig;
}

const PLACEHOLDER_HERO = '/images/products/ao-khoac-non-branded-04-den-1174884707.jpg';
const PLACEHOLDER_BANNER = '/images/products/ao-so-mi-non-branded-33-den-1174884163.jpg';

export const DECORATION_PRESETS: DecorationPreset[] = [
  {
    id: 'clean-simple',
    name: 'Clean & Simple',
    description: 'Just your best sellers — the closest to the default layout.',
    icon: Sparkles,
    build: () => ({
      version: DECORATION_VERSION,
      blocks: [
        {
          id: newBlockId(),
          type: 'best_sellers',
          data: { title: 'Featured', limit: 8, columns: 4 },
        },
      ],
    }),
  },
  {
    id: 'brand-story',
    name: 'Brand Story',
    description: 'A hero image, an intro paragraph, then your best sellers.',
    icon: BookOpen,
    build: () => ({
      version: DECORATION_VERSION,
      blocks: [
        {
          id: newBlockId(),
          type: 'hero',
          data: {
            images: [PLACEHOLDER_HERO],
            heading: 'Welcome to our shop',
            tagline: 'Handpicked products, made to last.',
            autoplay: true,
          },
        },
        {
          id: newBlockId(),
          type: 'rich_text',
          data: {
            heading: 'Our story',
            body: 'Tell customers what makes your shop special — your craft, your materials, and why you started.',
            align: 'center',
          },
        },
        {
          id: newBlockId(),
          type: 'best_sellers',
          data: { title: 'Best sellers', limit: 8, columns: 4 },
        },
      ],
    }),
  },
  {
    id: 'big-sale',
    name: 'Big Sale',
    description: 'A bold hero with a call to action, top deals, and a promo banner.',
    icon: Flame,
    build: () => ({
      version: DECORATION_VERSION,
      theme: { accent: '#ef4444' },
      blocks: [
        {
          id: newBlockId(),
          type: 'hero',
          data: {
            images: [PLACEHOLDER_HERO],
            heading: 'Season Sale is on',
            tagline: 'Limited-time deals across the shop.',
            cta: { label: 'Shop the sale', href: '#all-products' },
            autoplay: true,
          },
        },
        {
          id: newBlockId(),
          type: 'best_sellers',
          data: { title: 'Hot right now', limit: 4, columns: 4 },
        },
        {
          id: newBlockId(),
          type: 'image',
          data: { url: PLACEHOLDER_BANNER, alt: 'Promotional banner', ratio: 'wide' },
        },
      ],
    }),
  },
  {
    id: 'best-seller-showcase',
    name: 'Best-Seller Showcase',
    description: 'Lead with a heading, then a large grid of your top sellers.',
    icon: TrendingUp,
    build: () => ({
      version: DECORATION_VERSION,
      blocks: [
        {
          id: newBlockId(),
          type: 'rich_text',
          data: {
            heading: 'Our best sellers',
            body: 'The products customers love the most.',
            align: 'center',
          },
        },
        {
          id: newBlockId(),
          type: 'best_sellers',
          data: { title: '', limit: 12, columns: 4 },
        },
      ],
    }),
  },
  {
    id: 'minimal-welcome',
    name: 'Minimal Welcome',
    description: 'A short greeting above a compact best-sellers row.',
    icon: Hand,
    build: () => ({
      version: DECORATION_VERSION,
      blocks: [
        {
          id: newBlockId(),
          type: 'rich_text',
          data: {
            heading: 'Hello 👋',
            body: 'Thanks for stopping by — take a look at what we have.',
            align: 'left',
          },
        },
        {
          id: newBlockId(),
          type: 'best_sellers',
          data: { title: 'Popular picks', limit: 4, columns: 4 },
        },
      ],
    }),
  },
];
