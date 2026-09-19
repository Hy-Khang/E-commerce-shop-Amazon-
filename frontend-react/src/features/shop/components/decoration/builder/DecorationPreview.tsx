import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/common/utils/format.util';
import { ProductCard } from '@/features/product';
import type { Shop } from '../../../types/shop.types';
import type { DecorationConfig } from '../../../types/decoration.types';
import { ShopDecorationRenderer } from '../ShopDecorationRenderer';
import { SAMPLE_PRODUCTS } from '../../../utils/decoration-preview-samples';

interface Props {
  config: DecorationConfig;
  shop: Shop;
}

/**
 * Live preview of the decoration being edited, framed as a miniature storefront:
 * a mock shop header, the decoration blocks (same components shoppers see, via the
 * shared renderer), then a sample "All Products" grid — so the seller sees the full
 * page shape and that decoration is *additive* above the catalog. Runs the renderer
 * with `preview: true`, so unconfigured blocks show placeholders/sample products.
 * The frame is portal-styled; the inner content uses storefront semantic tokens.
 */
export function DecorationPreview({ config, shop }: Props) {
  const { t } = useTranslation('shop');
  const initial = shop.name?.trim().charAt(0).toUpperCase() || 'S';

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 text-xs text-slate-400">Storefront preview</span>
      </div>

      <div className="max-h-[70vh] overflow-y-auto bg-page">
        {/* Mock shop header — static chrome, not the real ShopHeader (no API/stats). */}
        <div className="relative">
          <div className="h-24 w-full bg-gradient-to-r from-primary-200 to-primary-100 sm:h-32">
            {shop.banner_url && (
              <img
                src={getImageUrl(shop.banner_url)}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex items-center gap-3 px-4 pb-4">
            <div className="-mt-6 flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-page bg-brand text-lg font-bold text-text-inverse">
              {shop.logo_url ? (
                <img src={getImageUrl(shop.logo_url)} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <h2 className="pt-1 text-lg font-bold tracking-tight text-text-primary">{shop.name}</h2>
          </div>
        </div>

        <div className="space-y-8 p-4">
          <ShopDecorationRenderer
            config={config}
            context={{ shopId: shop.id, shopSlug: shop.slug, preview: true }}
          />

          {/* Mock "All Products" — decoration is additive; the catalog is always below. */}
          <div>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-text-primary">
              {t('allProducts')}
            </h2>
            <p className="mb-4 text-xs text-text-muted">Sample — your real products show here.</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {SAMPLE_PRODUCTS.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
