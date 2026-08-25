import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Package, Store, Star, Eye, EyeOff, ZoomIn } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { formatPrice, formatDate, getImageUrl } from '@/common/utils/format.util';
import { ImageLightbox } from '@/common/components/ui/ImageLightbox';
import { ConfirmModal } from '@/common/components/ui/ConfirmModal';
import { useAdminProduct } from '../hooks/useAdminProduct';
import { useToggleProductActive } from '../hooks/useToggleProductActive';
import { getPriceRange } from '../utils/product.util';

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{children}</span>
    </div>
  );
}

export default function AdminProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading } = useAdminProduct(productId);
  const toggleActive = useToggleProductActive();
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [confirmToggle, setConfirmToggle] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!product) {
    return <div className="py-12 text-center text-slate-500">Product not found.</div>;
  }

  const range = getPriceRange(product.variants);
  const images = [...product.images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-8">
      <Link
        to={ROUTES.ADMIN_PRODUCTS}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              product.is_active ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmToggle(true)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              product.is_active
                ? 'text-rose-600 hover:bg-rose-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {product.is_active ? 'Hide' : 'Show'}
          </button>
          <Link
            to={ROUTES.ADMIN_PRODUCT_EDIT(product.id)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Thumbnail */}
        <div className="admin-card overflow-hidden p-4">
          {product.thumbnail_url ? (
            <button
              type="button"
              onClick={() => setZoomSrc(getImageUrl(product.thumbnail_url!))}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg ring-1 ring-slate-900/5"
              aria-label="Zoom thumbnail"
            >
              <img src={getImageUrl(product.thumbnail_url)} alt="" className="aspect-square w-full object-cover" />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <ZoomIn className="h-6 w-6 text-white" />
              </span>
            </button>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-900/5">
              <Package className="h-10 w-10 text-slate-300" />
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="admin-card p-6 lg:col-span-2">
          <div className="divide-y divide-slate-100">
            <MetaRow label="Shop">
              {product.shop ? (
                <Link
                  to={ROUTES.ADMIN_SHOP_DETAIL(product.shop.id)}
                  className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 transition-colors"
                >
                  <Store className="h-3.5 w-3.5 text-slate-400" />
                  {product.shop.name}
                </Link>
              ) : (
                <span className="text-slate-400">No shop</span>
              )}
            </MetaRow>
            <MetaRow label="Category">{product.category?.name ?? '—'}</MetaRow>
            <MetaRow label="Slug">
              <span className="font-mono text-xs text-slate-500">{product.slug}</span>
            </MetaRow>
            <MetaRow label="Price range">
              {range ? `${formatPrice(range.min)} — ${formatPrice(range.max)}` : '—'}
            </MetaRow>
            <MetaRow label="Variants">{product.variants.length}</MetaRow>
            <MetaRow label="Reviews">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {product.avgRating ? product.avgRating.toFixed(1) : '0.0'}
                <span className="text-slate-400">({product.reviewCount ?? 0})</span>
              </span>
            </MetaRow>
            <MetaRow label="Created">{formatDate(product.created_at)}</MetaRow>
          </div>
        </div>
      </div>

      {product.description && (
        <div className="admin-card p-6">
          <h2 className="text-sm font-semibold text-slate-900">Description</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{product.description}</p>
        </div>
      )}

      {/* Variants */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Variants ({product.variants.length})</h2>
        {product.variants.length > 0 ? (
          <div className="admin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="admin-table-header">
                    <th className="px-6 py-3.5 text-left">SKU</th>
                    {product.option1_label && <th className="px-6 py-3.5 text-left">{product.option1_label}</th>}
                    {product.option2_label && <th className="px-6 py-3.5 text-left">{product.option2_label}</th>}
                    <th className="px-6 py-3.5 text-left">Price</th>
                    <th className="px-6 py-3.5 text-left">Sale</th>
                    <th className="px-6 py-3.5 text-left">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {product.variants.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-slate-700">{v.sku}</td>
                      {product.option1_label && <td className="px-6 py-4 text-sm text-slate-700">{v.option1 || '—'}</td>}
                      {product.option2_label && <td className="px-6 py-4 text-sm text-slate-700">{v.option2 || '—'}</td>}
                      <td className="px-6 py-4 text-sm text-slate-700">{formatPrice(v.price)}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{v.sale_price ? formatPrice(v.sale_price) : '—'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{v.stock_quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No variants.</p>
        )}
      </section>

      {/* Gallery */}
      {images.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Images ({images.length})</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setZoomSrc(getImageUrl(img.image_url))}
                className="group relative block cursor-zoom-in overflow-hidden rounded-lg ring-1 ring-slate-900/5"
                aria-label="Zoom image"
              >
                <img src={getImageUrl(img.image_url)} alt="" className="aspect-square w-full object-cover" />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <ZoomIn className="h-5 w-5 text-white" />
                </span>
                {img.variant_option1 && (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-sky-500/80 px-1 text-[10px] font-medium text-white">
                    {img.variant_option1}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      <ImageLightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />

      <ConfirmModal
        open={confirmToggle}
        variant="warning"
        title={product.is_active ? 'Hide product?' : 'Show product?'}
        message={
          product.is_active
            ? `"${product.name}" will be hidden from the storefront until you show it again.`
            : `"${product.name}" will be visible on the storefront again.`
        }
        confirmLabel={product.is_active ? 'Hide' : 'Show'}
        confirmVariant={product.is_active ? 'danger' : 'primary'}
        loading={toggleActive.isPending}
        onCancel={() => setConfirmToggle(false)}
        onConfirm={() => {
          toggleActive.mutate(product.id, { onSuccess: () => setConfirmToggle(false) });
        }}
      />
    </div>
  );
}
