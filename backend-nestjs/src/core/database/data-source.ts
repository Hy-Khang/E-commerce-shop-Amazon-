import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { Role } from '../../features/auth/entities/role.entity';
import { User } from '../../features/auth/entities/user.entity';
import { RefreshToken } from '../../features/auth/entities/refresh-token.entity';
import { Address } from '../../features/user-profile/entities/address.entity';
import { Category } from '../../features/product/entities/category.entity';
import { Product } from '../../features/product/entities/product.entity';
import { ProductVariant } from '../../features/product/entities/product-variant.entity';
import { ProductImage } from '../../features/product/entities/product-image.entity';
import { Cart } from '../../features/cart/entities/cart.entity';
import { CartItem } from '../../features/cart/entities/cart-item.entity';
import { Order } from '../../features/order/entities/order.entity';
import { OrderItem } from '../../features/order/entities/order-item.entity';
import { Review } from '../../features/review/entities/review.entity';
import { WishlistItem } from '../../features/wishlist/entities/wishlist-item.entity';
import { Coupon } from '../../features/coupon/entities/coupon.entity';
import { CouponCategory } from '../../features/coupon/entities/coupon-category.entity';
import { CouponProduct } from '../../features/coupon/entities/coupon-product.entity';
import { CouponUsage } from '../../features/coupon/entities/coupon-usage.entity';
import { Permission } from '../../features/auth/entities/permission.entity';
import { RolePermission } from '../../features/auth/entities/role-permission.entity';
import { UserAuthProvider } from '../../features/auth/entities/user-auth-provider.entity';
import { OAuthCode } from '../../features/auth/entities/oauth-code.entity';
import { Shop } from '../../features/shop/entities/shop.entity';
import { Notification } from '../../features/notification/entities/notification.entity';
import { PaymentTransaction } from '../../features/payment/entities/payment-transaction.entity';
import { OrderStatusHistory } from '../../features/order/entities/order-status-history.entity';
import { OrderTrackingLocation } from '../../features/order/entities/order-tracking-location.entity';
import { FlashSale } from '../../features/flash-sale/entities/flash-sale.entity';
import { FlashSaleItem } from '../../features/flash-sale/entities/flash-sale-item.entity';

export const AppDataSource = new DataSource({
  type: 'mssql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '1433', 10),
  username: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'ecommerce_shop',
  entities: [
    Role,
    User,
    RefreshToken,
    Address,
    Category,
    Product,
    ProductVariant,
    ProductImage,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Review,
    WishlistItem,
    Coupon,
    CouponCategory,
    CouponProduct,
    CouponUsage,
    Permission,
    RolePermission,
    UserAuthProvider,
    OAuthCode,
    Shop,
    Notification,
    PaymentTransaction,
    OrderStatusHistory,
    OrderTrackingLocation,
    FlashSale,
    FlashSaleItem,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  options: {
    trustServerCertificate: true,
    useUTC: true,
  },
});
