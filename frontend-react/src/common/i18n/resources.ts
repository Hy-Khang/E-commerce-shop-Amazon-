// Central registry of translation namespaces.
// EN is the source of truth (typed off by i18next.d.ts); VI mirrors it and
// falls back to EN at runtime for any missing key.
// Add a new namespace here (both en + vi) when a phase introduces one.
import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enToast from './locales/en/toast.json';
import enValidation from './locales/en/validation.json';
import enErrors from './locales/en/errors.json';
import enEnums from './locales/en/enums.json';
import enCart from './locales/en/cart.json';
import enProduct from './locales/en/product.json';
import enOrder from './locales/en/order.json';
import enWishlist from './locales/en/wishlist.json';
import enReview from './locales/en/review.json';
import enNotification from './locales/en/notification.json';
import enUserProfile from './locales/en/userProfile.json';
import enRecentlyViewed from './locales/en/recentlyViewed.json';
import enShop from './locales/en/shop.json';
import enCoin from './locales/en/coin.json';
import enCompare from './locales/en/compare.json';
import enRecommendations from './locales/en/recommendations.json';
import enPayment from './locales/en/payment.json';
import enSellerApplication from './locales/en/sellerApplication.json';
import enAiChat from './locales/en/aiChat.json';

import viCommon from './locales/vi/common.json';
import viNav from './locales/vi/nav.json';
import viToast from './locales/vi/toast.json';
import viValidation from './locales/vi/validation.json';
import viErrors from './locales/vi/errors.json';
import viEnums from './locales/vi/enums.json';
import viCart from './locales/vi/cart.json';
import viProduct from './locales/vi/product.json';
import viOrder from './locales/vi/order.json';
import viWishlist from './locales/vi/wishlist.json';
import viReview from './locales/vi/review.json';
import viNotification from './locales/vi/notification.json';
import viUserProfile from './locales/vi/userProfile.json';
import viRecentlyViewed from './locales/vi/recentlyViewed.json';
import viShop from './locales/vi/shop.json';
import viCoin from './locales/vi/coin.json';
import viCompare from './locales/vi/compare.json';
import viRecommendations from './locales/vi/recommendations.json';
import viPayment from './locales/vi/payment.json';
import viSellerApplication from './locales/vi/sellerApplication.json';
import viAiChat from './locales/vi/aiChat.json';

export const defaultNS = 'common' as const;

export const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    toast: enToast,
    validation: enValidation,
    errors: enErrors,
    enums: enEnums,
    cart: enCart,
    product: enProduct,
    order: enOrder,
    wishlist: enWishlist,
    review: enReview,
    notification: enNotification,
    userProfile: enUserProfile,
    recentlyViewed: enRecentlyViewed,
    shop: enShop,
    coin: enCoin,
    compare: enCompare,
    recommendations: enRecommendations,
    payment: enPayment,
    sellerApplication: enSellerApplication,
    aiChat: enAiChat,
  },
  vi: {
    common: viCommon,
    nav: viNav,
    toast: viToast,
    validation: viValidation,
    errors: viErrors,
    enums: viEnums,
    cart: viCart,
    product: viProduct,
    order: viOrder,
    wishlist: viWishlist,
    review: viReview,
    notification: viNotification,
    userProfile: viUserProfile,
    recentlyViewed: viRecentlyViewed,
    shop: viShop,
    coin: viCoin,
    compare: viCompare,
    recommendations: viRecommendations,
    payment: viPayment,
    sellerApplication: viSellerApplication,
    aiChat: viAiChat,
  },
} as const;

export const ns = Object.keys(resources.en) as (keyof typeof resources.en)[];
