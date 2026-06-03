import type { TranslationSchema } from '../i18n.types';

export const en: TranslationSchema = {
  toast: {
    order: {
      placed: 'Order placed successfully!',
      cancelled: 'Order cancelled',
      statusUpdated: 'Order status updated',
      paymentUpdated: 'Payment status updated',
    },
    auth: {
      loggedOut: 'Logged out',
      roleUpdated: 'User role updated',
      statusUpdated: 'User status updated',
    },
    review: {
      submitted: 'Review submitted',
      deleted: 'Review deleted',
    },
    wishlist: {
      added: 'Added to wishlist',
      removed: 'Removed from wishlist',
    },
    coupon: {
      created: 'Coupon created',
      updated: 'Coupon updated',
      deactivated: 'Coupon deactivated',
    },
    product: {
      created: 'Product created',
      updated: 'Product updated',
      statusUpdated: 'Product status updated',
    },
    variant: {
      added: 'Variant added',
      updated: 'Variant updated',
      deleted: 'Variant deleted',
    },
    image: {
      added: 'Image added',
      updated: 'Image updated',
      deleted: 'Image deleted',
    },
    category: {
      created: 'Category created',
      updated: 'Category updated',
      deleted: 'Category deleted',
    },
    profile: {
      updated: 'Profile updated',
    },
    address: {
      added: 'Address added',
      updated: 'Address updated',
      deleted: 'Address deleted',
      defaultSet: 'Default address updated',
    },
    cart: {
      added: 'Added to cart',
      removed: 'Removed from cart',
    },
    upload: {
      success: 'Image uploaded successfully',
      error: 'Failed to upload image',
      tooLarge: 'File is too large (max 5MB)',
      invalidType: 'Only JPEG, PNG, and WebP files are allowed',
    },
    error: {
      generic: 'An unexpected error occurred',
    },
  },
};
