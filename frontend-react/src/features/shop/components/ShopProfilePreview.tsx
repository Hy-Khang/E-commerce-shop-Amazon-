import { Store, ExternalLink, ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/common/utils/format.util';
import { ROUTES } from '@/common/constants/routes';
import { ShopStatusBadge } from './ShopStatusBadge';
import type { ShopStatus } from '../types/shop.types';

interface ShopProfilePreviewProps {
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  slug?: string;
  status?: ShopStatus;
}

/**
 * Storefront-style header preview: banner hero + overlapping circular logo,
 * shop name, live status and a link to the public page. Reads the live
 * (watched) form values so it updates as the seller uploads images.
 */
export function ShopProfilePreview({ name, logoUrl, bannerUrl, slug, status }: ShopProfilePreviewProps) {
  const banner = bannerUrl ? getImageUrl(bannerUrl) : null;
  const logo = logoUrl ? getImageUrl(logoUrl) : null;
  const canViewPublic = !!slug && status === 'active';

  return (
    <div className="admin-card overflow-hidden">
      <div className="relative h-36 w-full sm:h-44">
        {banner ? (
          <img src={banner} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-50/80">
              <ImageIcon className="h-4 w-4" />
              No banner yet
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      <div className="px-6 pb-5">
        <div className="flex items-end gap-4">
          <div className="relative z-10 -mt-12 h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-white shadow-lg ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900">
            {logo ? (
              <img src={logo} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700">
                {name ? (
                  <span className="text-3xl font-bold">{name.charAt(0).toUpperCase()}</span>
                ) : (
                  <Store className="h-8 w-8" />
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-bold text-slate-900 dark:text-slate-100">
                {name || 'Your Shop'}
              </h2>
              {status && <ShopStatusBadge status={status} />}
            </div>
            {slug && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-mono">/{slug}</span>
                {canViewPublic && (
                  <a
                    href={ROUTES.SHOP_PROFILE(slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-amber-600 transition-colors hover:text-amber-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View public shop
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
