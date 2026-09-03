import { Link } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { getImageUrl } from '@/common/utils/format.util';
import { hasAnyStock } from '@/features/product';
import { AddToCartButton } from '@/features/cart';
import { useCompare } from '../hooks/useCompare';
import { COMPARISON_ROWS } from '../components/comparisonRows';

export default function ComparePage() {
  const { products, count, isLoading, remove, clear } = useCompare();

  // Products selected but not yet hydrated — avoid flashing a column-less table.
  if (count > 0 && isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-text-secondary">
        Đang tải sản phẩm so sánh…
      </div>
    );
  }

  if (count === 0 || products.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Scale className="h-16 w-16 text-text-muted/60" />
        <h1 className="mt-4 text-lg font-semibold text-text-primary">Chưa có sản phẩm để so sánh</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Bấm nút <span className="font-medium">So sánh</span> trên sản phẩm để thêm vào đây.
        </p>
        <Link
          to={ROUTES.PRODUCTS}
          className="mt-6 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Khám phá sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">So sánh sản phẩm</h1>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-default bg-elevated">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-elevated p-4" />
              {products.map((p) => (
                <th key={p.id} className="min-w-[180px] border-l border-border-default p-4 align-top">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      aria-label="Xóa khỏi so sánh"
                      className="absolute right-0 top-0 rounded-full p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <Link to={ROUTES.PRODUCT_DETAIL(p.slug)} className="block">
                      <div className="aspect-square overflow-hidden rounded-lg border border-border-default bg-surface-hover">
                        {p.thumbnail_url ? (
                          <img
                            src={getImageUrl(p.thumbnail_url)}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-text-muted">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="mt-2 line-clamp-2 text-left text-sm font-semibold text-text-primary hover:text-text-brand">
                        {p.name}
                      </div>
                    </Link>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => {
              const differs =
                products.length > 1 && new Set(products.map(row.signature)).size > 1;
              return (
                <tr key={row.label} className="border-t border-border-default">
                  <td
                    className={`sticky left-0 z-10 p-4 align-top text-xs font-semibold uppercase tracking-wider ${
                      differs ? 'bg-brand-light text-text-brand' : 'bg-elevated text-text-muted'
                    }`}
                  >
                    {row.label}
                  </td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className={`border-l border-border-default p-4 align-top text-text-secondary ${
                        differs ? 'bg-brand-light/30' : ''
                      }`}
                    >
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr className="border-t border-border-default">
              <td className="sticky left-0 z-10 bg-elevated p-4" />
              {products.map((p) => (
                <td key={p.id} className="border-l border-border-default p-4 align-top">
                  {p.variants.length === 1 ? (
                    <AddToCartButton
                      variantId={p.variants[0].id}
                      disabled={!hasAnyStock(p.variants)}
                      className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-neutral-300"
                    />
                  ) : (
                    <Link
                      to={ROUTES.PRODUCT_DETAIL(p.slug)}
                      className="block rounded-lg border border-border-brand px-3 py-2 text-center text-sm font-semibold text-text-brand transition-colors hover:bg-brand-light"
                    >
                      Chọn mua
                    </Link>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
