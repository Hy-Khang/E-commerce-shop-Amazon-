// Display copy (heading / description / ctaText) is localized in
// PromotionalBanner via the `product` i18n namespace (`promo.*`). Only the
// non-textual bits (promo code, discount figure, link) live here.
export const HOMEPAGE_PROMO = {
  code: 'NOOK10',
  discount: '10%',
  ctaLink: '/products',
} as const;
