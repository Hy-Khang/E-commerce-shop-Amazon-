import { useMemo, useState } from 'react';
import { Package, ShoppingCart, Store, Users, Tag, FolderTree } from 'lucide-react';
import { PERMISSIONS } from '@/common/constants/permissions';
import { ROUTES } from '@/common/constants/routes';
import { useDebounce } from '@/common/hooks/useDebounce';
import { formatPrice } from '@/common/utils/format.util';
import { useAdminUsers, usePermissions } from '@/features/auth';
import { useAdminProducts, useAdminCategories } from '@/features/product';
import { useAdminOrders } from '@/features/order';
import { useAdminShops } from '@/features/shop';
import { useAdminCoupons } from '@/features/coupon';
import { GlobalSearchBox, type SearchGroup } from './GlobalSearchBox';

const MIN_CHARS = 2;
const PER_GROUP = 5;

export function AdminGlobalSearch() {
  const { hasPermission } = usePermissions();
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);

  const q = useDebounce(value, 300).trim();
  const active = open && q.length >= MIN_CHARS;

  const can = {
    products: hasPermission(PERMISSIONS.PRODUCTS_READ),
    orders: hasPermission(PERMISSIONS.ORDERS_READ),
    shops: hasPermission(PERMISSIONS.SHOPS_READ),
    users: hasPermission(PERMISSIONS.USERS_READ),
    coupons: hasPermission(PERMISSIONS.COUPONS_READ),
    categories: hasPermission(PERMISSIONS.CATEGORIES_READ),
  };

  const params = { page: 1, limit: PER_GROUP, search: q };
  const products = useAdminProducts(params, { enabled: active && can.products });
  const orders = useAdminOrders(params, { enabled: active && can.orders });
  const shops = useAdminShops(params, { enabled: active && can.shops });
  const users = useAdminUsers(params, { enabled: active && can.users });
  const coupons = useAdminCoupons(params, { enabled: active && can.coupons });
  const categories = useAdminCategories(params, { enabled: active && can.categories });

  const groups = useMemo<SearchGroup[]>(() => {
    const g: SearchGroup[] = [];
    if (products.data?.data.length) {
      g.push({
        label: 'Products',
        items: products.data.data.map((p) => ({
          key: `product-${p.id}`,
          label: p.name,
          sublabel: p.shop?.name ?? 'No shop',
          to: ROUTES.ADMIN_PRODUCT_DETAIL(p.id),
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
          label: `#${o.id} · ${o.shop_name}`,
          sublabel: `${o.status} · ${formatPrice(o.total_amount)}`,
          to: ROUTES.ADMIN_ORDER_DETAIL(o.id),
          icon: ShoppingCart,
        })),
      });
    }
    if (shops.data?.data.length) {
      g.push({
        label: 'Shops',
        items: shops.data.data.map((s) => ({
          key: `shop-${s.id}`,
          label: s.name,
          sublabel: `/${s.slug} · ${s.status}`,
          to: ROUTES.ADMIN_SHOP_DETAIL(s.id),
          icon: Store,
        })),
      });
    }
    if (users.data?.data.length) {
      g.push({
        label: 'Users',
        items: users.data.data.map((u) => ({
          key: `user-${u.id}`,
          label: u.full_name,
          sublabel: u.email,
          to: ROUTES.ADMIN_USER_DETAIL(u.id),
          icon: Users,
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
          to: `${ROUTES.ADMIN_COUPONS}?search=${encodeURIComponent(c.code)}`,
          icon: Tag,
        })),
      });
    }
    if (categories.data?.data.length) {
      g.push({
        label: 'Categories',
        items: categories.data.data.map((c) => ({
          key: `category-${c.id}`,
          label: c.name,
          sublabel: `/${c.slug}`,
          to: `${ROUTES.ADMIN_CATEGORIES}?search=${encodeURIComponent(c.name)}`,
          icon: FolderTree,
        })),
      });
    }
    return g;
  }, [products.data, orders.data, shops.data, users.data, coupons.data, categories.data]);

  const isLoading =
    active &&
    (products.isFetching ||
      orders.isFetching ||
      shops.isFetching ||
      users.isFetching ||
      coupons.isFetching ||
      categories.isFetching);

  return (
    <GlobalSearchBox
      value={value}
      onValueChange={setValue}
      open={open}
      setOpen={setOpen}
      groups={groups}
      isLoading={isLoading}
      minChars={MIN_CHARS}
      placeholder="Search products, orders, users…"
    />
  );
}
