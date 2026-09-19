import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePagination } from '@/common/hooks/usePagination';
import { Button } from '@/common/components/ui/Button';
import { ProductCard } from '@/features/product';
import { ProductCardSkeleton } from '@/features/product/components/ProductCardSkeleton';
import { useShop } from '../hooks/useShop';
import { useShopProducts } from '../hooks/useShopProducts';
import { ShopHeader } from '../components/ShopHeader';
import { ShopDecorationRenderer } from '../components/decoration/ShopDecorationRenderer';

export default function ShopProfilePage() {
  const { t } = useTranslation('shop');
  const { slug } = useParams<{ slug: string }>();
  const { data: shop, isLoading: shopLoading } = useShop(slug!);
  const { params, setPage } = usePagination({ limit: 20, sort: 'created_at', order: 'desc' });
  const { data: products, isLoading: productsLoading } = useShopProducts(slug!, params);

  if (shopLoading) {
    return <div className="py-12 text-center text-text-secondary">{t('loading')}</div>;
  }

  if (!shop) {
    return <div className="py-12 text-center text-text-secondary">{t('notFound')}</div>;
  }

  const decoration = shop.decoration_config;

  return (
    <div className="space-y-8">
      <ShopHeader shop={shop} />

      {decoration && decoration.blocks.length > 0 && (
        <ShopDecorationRenderer
          config={decoration}
          context={{ shopId: shop.id, shopSlug: shop.slug }}
        />
      )}

      <div>
        <h2 className="mb-6 text-xl font-bold tracking-tight text-text-primary">{t('allProducts')}</h2>

        {productsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products && products.data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(products.meta.page - 1)}
                  disabled={products.meta.page <= 1}
                >
                  {t('pagination.previous')}
                </Button>
                <span className="text-sm text-text-secondary">
                  {t('pagination.pageOf', { page: products.meta.page, totalPages: products.meta.totalPages })}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(products.meta.page + 1)}
                  disabled={products.meta.page >= products.meta.totalPages}
                >
                  {t('pagination.next')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-text-secondary">{t('noProducts')}</div>
        )}
      </div>
    </div>
  );
}
