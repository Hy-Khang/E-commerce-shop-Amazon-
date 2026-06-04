import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/core/layouts/MainLayout';
import { AuthLayout } from '@/core/layouts/AuthLayout';
import { AdminLayout } from '@/core/layouts/AdminLayout';
import { AuthGuard } from './AuthGuard';
import { RoleGuard } from './RoleGuard';

const HomePage = lazy(() => import('@/features/product/pages/HomePage'));
const ProductListPage = lazy(() => import('@/features/product/pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/features/product/pages/ProductDetailPage'));
const CategoryPage = lazy(() => import('@/features/product/pages/CategoryPage'));

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));

const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/features/order/pages/CheckoutPage'));
const OrderHistoryPage = lazy(() => import('@/features/order/pages/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('@/features/order/pages/OrderDetailPage'));

const ProfilePage = lazy(() => import('@/features/user-profile/pages/ProfilePage'));
const AddressListPage = lazy(() => import('@/features/user-profile/pages/AddressListPage'));

const AdminProductListPage = lazy(() => import('@/features/product/pages/AdminProductListPage'));
const AdminProductCreatePage = lazy(() => import('@/features/product/pages/AdminProductCreatePage'));
const AdminProductEditPage = lazy(() => import('@/features/product/pages/AdminProductEditPage'));
const AdminOrderListPage = lazy(() => import('@/features/order/pages/AdminOrderListPage'));
const AdminOrderDetailPage = lazy(() => import('@/features/order/pages/AdminOrderDetailPage'));

const MyReviewsPage = lazy(() => import('@/features/review/pages/MyReviewsPage'));
const WishlistPage = lazy(() => import('@/features/wishlist/pages/WishlistPage'));

const AdminRoleListPage = lazy(() => import('@/features/auth/pages/AdminRoleListPage'));
const AdminPermissionPage = lazy(() => import('@/features/auth/pages/AdminPermissionPage'));
const AdminUserListPage = lazy(() => import('@/features/auth/pages/AdminUserListPage'));
const AdminUserDetailPage = lazy(() => import('@/features/auth/pages/AdminUserDetailPage'));
const AdminCategoryListPage = lazy(() => import('@/features/product/pages/AdminCategoryListPage'));
const AdminCategoryCreatePage = lazy(() => import('@/features/product/pages/AdminCategoryCreatePage'));
const AdminCategoryEditPage = lazy(() => import('@/features/product/pages/AdminCategoryEditPage'));
const AdminReviewListPage = lazy(() => import('@/features/review/pages/AdminReviewListPage'));
const AdminWishlistPopularPage = lazy(() => import('@/features/wishlist/pages/AdminWishlistPopularPage'));

const AdminCouponListPage = lazy(() => import('@/features/coupon/pages/AdminCouponListPage'));
const AdminCouponCreatePage = lazy(() => import('@/features/coupon/pages/AdminCouponCreatePage'));
const AdminCouponEditPage = lazy(() => import('@/features/coupon/pages/AdminCouponEditPage'));

const NotFoundPage = lazy(() => import('@/common/components/feedback/NotFoundPage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <SuspenseWrapper><HomePage /></SuspenseWrapper> },
      { path: 'products', element: <SuspenseWrapper><ProductListPage /></SuspenseWrapper> },
      { path: 'products/:slug', element: <SuspenseWrapper><ProductDetailPage /></SuspenseWrapper> },
      { path: 'categories/:slug', element: <SuspenseWrapper><CategoryPage /></SuspenseWrapper> },
      { path: 'cart', element: <SuspenseWrapper><CartPage /></SuspenseWrapper> },

      {
        element: <AuthGuard />,
        children: [
          { path: 'checkout', element: <SuspenseWrapper><CheckoutPage /></SuspenseWrapper> },
          { path: 'orders', element: <SuspenseWrapper><OrderHistoryPage /></SuspenseWrapper> },
          { path: 'orders/:id', element: <SuspenseWrapper><OrderDetailPage /></SuspenseWrapper> },
          { path: 'profile', element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper> },
          { path: 'profile/addresses', element: <SuspenseWrapper><AddressListPage /></SuspenseWrapper> },
          { path: 'profile/reviews', element: <SuspenseWrapper><MyReviewsPage /></SuspenseWrapper> },
          { path: 'wishlist', element: <SuspenseWrapper><WishlistPage /></SuspenseWrapper> },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
      { path: 'register', element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <RoleGuard role="admin" />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: 'admin/products', element: <SuspenseWrapper><AdminProductListPage /></SuspenseWrapper> },
              { path: 'admin/products/new', element: <SuspenseWrapper><AdminProductCreatePage /></SuspenseWrapper> },
              { path: 'admin/products/:id/edit', element: <SuspenseWrapper><AdminProductEditPage /></SuspenseWrapper> },
              { path: 'admin/categories', element: <SuspenseWrapper><AdminCategoryListPage /></SuspenseWrapper> },
              { path: 'admin/categories/new', element: <SuspenseWrapper><AdminCategoryCreatePage /></SuspenseWrapper> },
              { path: 'admin/categories/:id/edit', element: <SuspenseWrapper><AdminCategoryEditPage /></SuspenseWrapper> },
              { path: 'admin/orders', element: <SuspenseWrapper><AdminOrderListPage /></SuspenseWrapper> },
              { path: 'admin/orders/:id', element: <SuspenseWrapper><AdminOrderDetailPage /></SuspenseWrapper> },
              { path: 'admin/users', element: <SuspenseWrapper><AdminUserListPage /></SuspenseWrapper> },
              { path: 'admin/users/:id', element: <SuspenseWrapper><AdminUserDetailPage /></SuspenseWrapper> },
              { path: 'admin/roles', element: <SuspenseWrapper><AdminRoleListPage /></SuspenseWrapper> },
              { path: 'admin/permissions', element: <SuspenseWrapper><AdminPermissionPage /></SuspenseWrapper> },
              { path: 'admin/reviews', element: <SuspenseWrapper><AdminReviewListPage /></SuspenseWrapper> },
              { path: 'admin/wishlist', element: <SuspenseWrapper><AdminWishlistPopularPage /></SuspenseWrapper> },
              { path: 'admin/coupons', element: <SuspenseWrapper><AdminCouponListPage /></SuspenseWrapper> },
              { path: 'admin/coupons/new', element: <SuspenseWrapper><AdminCouponCreatePage /></SuspenseWrapper> },
              { path: 'admin/coupons/:id/edit', element: <SuspenseWrapper><AdminCouponEditPage /></SuspenseWrapper> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
]);
