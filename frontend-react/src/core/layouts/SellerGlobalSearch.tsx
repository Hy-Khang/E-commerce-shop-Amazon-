import { useMemo, useState } from 'react';
import { Package, ShoppingCart, Tag } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { ROUTES } from '@/common/constants/routes';
import { useDebounce } from '@/common/hooks/useDebounce';
import { formatPrice } from '@/common/utils/format.util';
import { usePermissions } from '@/features/auth';
import { useSellerProducts } from '@/features/product';
import { useSellerOrders } from '@/features/order';
import { useSellerCoupons } from '@/features/coupon';
import { GlobalSearchBox, type SearchGroup } from './GlobalSearchBox';

const MIN_CHARS = 2;
const PER_GROUP = 5;

export function SellerGlobalSearch() {
  const { hasPermission } = usePermissions();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const q = useDebounce(value, 300).trim();
  const active = open && q.length >= MIN_CHARS;

  const can = {
    products: hasPermission(PERMISSIONS.PRODUCTS_READ),
    orders: hasPermission(PERMISSIONS.ORDERS_READ),
    coupons: hasPermission(PERMISSIONS.COUPONS_READ),
  };

  const params = { page: 1, limit: PER_GROUP, search: q };
  const products = useSellerProducts(params, { enabled: active && can.products });
  const orders = useSellerOrders(params, { enabled: active && can.orders });
  const coupons = useSellerCoupons(params, { enabled: active && can.coupons });

  const groups = useMemo<SearchGroup[]>(() => {
    const g: SearchGroup[] = [];
    if (products.data?.data.length) {
      g.push({
        label: 'Products',
        items: products.data.data.map((p) => ({
          key: `product-${p.id}`,
          label: p.name,
          sublabel: p.is_active ? 'Active' : 'Hidden',
          to: ROUTES.SELLER_PRODUCT_EDIT(p.id),
          icon: Package,
          thumbnail: p.thumbnail_url,
        })),
      });
    }
    if (orders.data?.data.length) {
      g.push({
        label: 'Orders',
        items: orders.data.data.map((o) => ({
          key: `order-${o.id}`,
          label: `#${o.id}`,
          sublabel: `${o.status} · ${formatPrice(o.total_amount)}`,
          to: ROUTES.SELLER_ORDER_DETAIL(o.id),
          icon: ShoppingCart,
        })),
      });
    }
    if (coupons.data?.data.length) {
      g.push({
        label: 'Coupons',
        items: coupons.data.data.map((c) => ({
          key: `coupon-${c.id}`,
          label: c.code,
          sublabel: c.description ?? undefined,
          to: `${ROUTES.SELLER_COUPONS}?search=${encodeURIComponent(c.code)}`,
          icon: Tag,
        })),
      });
    }
    return g;
  }, [products.data, orders.data, coupons.data]);

  const isLoading =
    active && (products.isFetching || orders.isFetching || coupons.isFetching);

  return (
    <GlobalSearchBox
      value={value}
      onValueChange={setValue}
      open={open}
      setOpen={setOpen}
      groups={groups}
      isLoading={isLoading}
      minChars={MIN_CHARS}
      placeholder="Search your products, orders…"
    />
  );
}
