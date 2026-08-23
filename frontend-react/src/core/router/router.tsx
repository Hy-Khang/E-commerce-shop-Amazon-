/*
 * Route-configuration module: it exports the `router` config object alongside
 * lazy-loaded page components, so it can't satisfy react-refresh's
 * "only export components" rule. Fast refresh doesn't apply to a router config
 * anyway, so the rule is disabled for this file only.
 */
/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/core/layouts/MainLayout';
import { AuthLayout } from '@/core/layouts/AuthLayout';
import { AdminLayout } from '@/core/layouts/AdminLayout';
import { SellerLayout } from '@/core/layouts/SellerLayout';
import { ShipperLayout } from '@/core/layouts/ShipperLayout';
import { AuthGuard } from './AuthGuard';
import { PortalGuard } from './PortalGuard';
import { PERMISSIONS } from '@/common/constants/permissions';

const HomePage = lazy(() => import('@/features/product/pages/HomePage'));
const ProductListPage = lazy(() => import('@/features/product/pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/features/product/pages/ProductDetailPage'));
const CategoryPage = lazy(() => import('@/features/product/pages/CategoryPage'));

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));
const OAuthCallbackPage = lazy(() => import('@/features/auth/pages/OAuthCallbackPage'));

const CartPage = lazy(() => import('@/features/cart/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/features/order/pages/CheckoutPage'));
const CheckoutSuccessPage = lazy(() => import('@/features/order/pages/CheckoutSuccessPage'));
const PaymentResultPage = lazy(() => import('@/features/payment/pages/PaymentResultPage'));
const OrderHistoryPage = lazy(() => import('@/features/order/pages/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('@/features/order/pages/OrderDetailPage'));

const ProfilePage = lazy(() => import('@/features/user-profile/pages/ProfilePage'));
const AddressListPage = lazy(() => import('@/features/user-profile/pages/AddressListPage'));
const AccountLayout = lazy(() => import('@/core/layouts/AccountLayout'));

const AdminDashboardPage = lazy(() => import('@/features/dashboard/pages/AdminDashboardPage'));
const AdminProductListPage = lazy(() => import('@/features/product/pages/AdminProductListPage'));
const AdminProductCreatePage = lazy(() => import('@/features/product/pages/AdminProductCreatePage'));
const AdminProductEditPage = lazy(() => import('@/features/product/pages/AdminProductEditPage'));
const AdminOrderListPage = lazy(() => import('@/features/order/pages/AdminOrderListPage'));
const AdminOrderDetailPage = lazy(() => import('@/features/order/pages/AdminOrderDetailPage'));

const MyReviewsPage = lazy(() => import('@/features/review/pages/MyReviewsPage'));
const WishlistPage = lazy(() => import('@/features/wishlist/pages/WishlistPage'));
const NotificationPage = lazy(() => import('@/features/notification/pages/NotificationPage'));

const AdminRoleListPage = lazy(() => import('@/features/auth/pages/AdminRoleListPage'));
const AdminPermissionPage = lazy(() => import('@/features/auth/pages/AdminPermissionPage'));
const AdminUserListPage = lazy(() => import('@/features/auth/pages/AdminUserListPage'));
const AdminUserDetailPage = lazy(() => import('@/features/auth/pages/AdminUserDetailPage'));
const AdminCategoryListPage = lazy(() => import('@/features/product/pages/AdminCategoryListPage'));
const AdminReviewListPage = lazy(() => import('@/features/review/pages/AdminReviewListPage'));
const AdminWishlistPopularPage = lazy(() => import('@/features/wishlist/pages/AdminWishlistPopularPage'));

const AdminCouponListPage = lazy(() => import('@/features/coupon/pages/AdminCouponListPage'));

const SellerDashboardPage = lazy(() => import('@/features/dashboard/pages/SellerDashboardPage'));
const SellerProductListPage = lazy(() => import('@/features/product/pages/SellerProductListPage'));
const SellerProductCreatePage = lazy(() => import('@/features/product/pages/SellerProductCreatePage'));
const SellerProductEditPage = lazy(() => import('@/features/product/pages/SellerProductEditPage'));
const SellerOrderListPage = lazy(() => import('@/features/order/pages/SellerOrderListPage'));
const SellerOrderDetailPage = lazy(() => import('@/features/order/pages/SellerOrderDetailPage'));

const ShopProfilePage = lazy(() => import('@/features/shop/pages/ShopProfilePage'));
const SellerShopSettingsPage = lazy(() => import('@/features/shop/pages/SellerShopSettingsPage'));
const SellerCouponListPage = lazy(() => import('@/features/coupon/pages/SellerCouponListPage'));
const SellerReviewListPage = lazy(() => import('@/features/review/pages/SellerReviewListPage'));
const SellerWishlistPopularPage = lazy(() => import('@/features/wishlist/pages/SellerWishlistPopularPage'));
const AdminShopListPage = lazy(() => import('@/features/shop/pages/AdminShopListPage'));
const AdminShopDetailPage = lazy(() => import('@/features/shop/pages/AdminShopDetailPage'));

const ShipperDashboardPage = lazy(() => import('@/features/dashboard/pages/ShipperDashboardPage'));
const ShipperDeliveryListPage = lazy(() => import('@/features/order/pages/ShipperDeliveryListPage'));
const ShipperDeliveryDetailPage = lazy(() => import('@/features/order/pages/ShipperDeliveryDetailPage'));

const NotFoundPage = lazy(() => import('@/common/components/feedback/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/common/components/feedback/ForbiddenPage'));

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
      { path: 'shops/:slug', element: <SuspenseWrapper><ShopProfilePage /></SuspenseWrapper> },
      { path: 'cart', element: <SuspenseWrapper><CartPage /></SuspenseWrapper> },

      {
        element: <AuthGuard />,
        children: [
          { path: 'checkout', element: <SuspenseWrapper><CheckoutPage /></SuspenseWrapper> },
          { path: 'checkout/success', element: <SuspenseWrapper><CheckoutSuccessPage /></SuspenseWrapper> },
          { path: 'checkout/payment-result', element: <SuspenseWrapper><PaymentResultPage /></SuspenseWrapper> },
          { path: 'orders/:id', element: <SuspenseWrapper><OrderDetailPage /></SuspenseWrapper> },
          {
            element: <SuspenseWrapper><AccountLayout /></SuspenseWrapper>,
            children: [
              { path: 'orders', element: <SuspenseWrapper><OrderHistoryPage /></SuspenseWrapper> },
              { path: 'profile', element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper> },
              { path: 'profile/addresses', element: <SuspenseWrapper><AddressListPage /></SuspenseWrapper> },
              { path: 'notifications', element: <SuspenseWrapper><NotificationPage /></SuspenseWrapper> },
              { path: 'profile/reviews', element: <SuspenseWrapper><MyReviewsPage /></SuspenseWrapper> },
              { path: 'wishlist', element: <SuspenseWrapper><WishlistPage /></SuspenseWrapper> },
            ],
          },
        ],
      },

    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <SuspenseWrapper><LoginPage /></SuspenseWrapper> },
      { path: 'register', element: <SuspenseWrapper><RegisterPage /></SuspenseWrapper> },
      { path: 'verify-email', element: <SuspenseWrapper><VerifyEmailPage /></SuspenseWrapper> },
      { path: 'forgot-password', element: <SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper> },
      { path: 'reset-password', element: <SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper> },
    ],
  },
  {
    path: 'oauth/callback',
    element: <SuspenseWrapper><OAuthCallbackPage /></SuspenseWrapper>,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <PortalGuard requiredPermission={PERMISSIONS.PORTAL_ADMIN} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: 'admin/dashboard', element: <SuspenseWrapper><AdminDashboardPage /></SuspenseWrapper> },
              { path: 'admin/products', element: <SuspenseWrapper><AdminProductListPage /></SuspenseWrapper> },
              { path: 'admin/products/new', element: <SuspenseWrapper><AdminProductCreatePage /></SuspenseWrapper> },
              { path: 'admin/products/:id/edit', element: <SuspenseWrapper><AdminProductEditPage /></SuspenseWrapper> },
              { path: 'admin/categories', element: <SuspenseWrapper><AdminCategoryListPage /></SuspenseWrapper> },
              { path: 'admin/orders', element: <SuspenseWrapper><AdminOrderListPage /></SuspenseWrapper> },
              { path: 'admin/orders/:id', element: <SuspenseWrapper><AdminOrderDetailPage /></SuspenseWrapper> },
              { path: 'admin/shops', element: <SuspenseWrapper><AdminShopListPage /></SuspenseWrapper> },
              { path: 'admin/shops/:id', element: <SuspenseWrapper><AdminShopDetailPage /></SuspenseWrapper> },
              { path: 'admin/users', element: <SuspenseWrapper><AdminUserListPage /></SuspenseWrapper> },
              { path: 'admin/users/:id', element: <SuspenseWrapper><AdminUserDetailPage /></SuspenseWrapper> },
              { path: 'admin/roles', element: <SuspenseWrapper><AdminRoleListPage /></SuspenseWrapper> },
              { path: 'admin/permissions', element: <SuspenseWrapper><AdminPermissionPage /></SuspenseWrapper> },
              { path: 'admin/reviews', element: <SuspenseWrapper><AdminReviewListPage /></SuspenseWrapper> },
              { path: 'admin/wishlist', element: <SuspenseWrapper><AdminWishlistPopularPage /></SuspenseWrapper> },
              { path: 'admin/coupons', element: <SuspenseWrapper><AdminCouponListPage /></SuspenseWrapper> },
              { path: 'admin/notifications', element: <SuspenseWrapper><NotificationPage /></SuspenseWrapper> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <PortalGuard requiredPermission={PERMISSIONS.PORTAL_SELLER} />,
        children: [
          {
            element: <SellerLayout />,
            children: [
              { path: 'seller/dashboard', element: <SuspenseWrapper><SellerDashboardPage /></SuspenseWrapper> },
              { path: 'seller/products', element: <SuspenseWrapper><SellerProductListPage /></SuspenseWrapper> },
              { path: 'seller/products/new', element: <SuspenseWrapper><SellerProductCreatePage /></SuspenseWrapper> },
              { path: 'seller/products/:id/edit', element: <SuspenseWrapper><SellerProductEditPage /></SuspenseWrapper> },
              { path: 'seller/orders', element: <SuspenseWrapper><SellerOrderListPage /></SuspenseWrapper> },
              { path: 'seller/orders/:id', element: <SuspenseWrapper><SellerOrderDetailPage /></SuspenseWrapper> },
              { path: 'seller/shop', element: <SuspenseWrapper><SellerShopSettingsPage /></SuspenseWrapper> },
              { path: 'seller/coupons', element: <SuspenseWrapper><SellerCouponListPage /></SuspenseWrapper> },
              { path: 'seller/reviews', element: <SuspenseWrapper><SellerReviewListPage /></SuspenseWrapper> },
              { path: 'seller/wishlist', element: <SuspenseWrapper><SellerWishlistPopularPage /></SuspenseWrapper> },
              { path: 'seller/notifications', element: <SuspenseWrapper><NotificationPage /></SuspenseWrapper> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <PortalGuard requiredPermission={PERMISSIONS.PORTAL_SHIPPER} />,
        children: [
          {
            element: <ShipperLayout />,
            children: [
              { path: 'shipper/dashboard', element: <SuspenseWrapper><ShipperDashboardPage /></SuspenseWrapper> },
              { path: 'shipper/deliveries', element: <SuspenseWrapper><ShipperDeliveryListPage /></SuspenseWrapper> },
              { path: 'shipper/deliveries/:id', element: <SuspenseWrapper><ShipperDeliveryDetailPage /></SuspenseWrapper> },
              { path: 'shipper/notifications', element: <SuspenseWrapper><NotificationPage /></SuspenseWrapper> },
            ],
          },
        ],
      },
    ],
  },
  { path: '403', element: <SuspenseWrapper><ForbiddenPage /></SuspenseWrapper> },
  { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
]);
