// Hooks
export { shopKeys, useShop } from './hooks/useShop';
export { useShopProducts } from './hooks/useShopProducts';
export { useMyShop, useCreateMyShop, useUpdateMyShop } from './hooks/useMyShop';
export { adminShopKeys, useAdminShops } from './hooks/useAdminShops';
export { useAdminShop } from './hooks/useAdminShop';
export { useUpdateShopStatus } from './hooks/useUpdateShopStatus';

// Components
export { ShopInfoCard } from './components/ShopInfoCard';
export { ShopHeader } from './components/ShopHeader';
export { ShopSettingsForm } from './components/ShopSettingsForm';
export { ShopStatusBadge } from './components/ShopStatusBadge';
export { ShopFilters } from './components/ShopFilters';
export { AdminShopSelect } from './components/AdminShopSelect';

// Types
export type {
  ShopStatus,
  Shop,
  ShopProfile,
  AdminShop,
  ShopListParams,
  AdminShopQueryParams,
  CreateShopRequest,
  UpdateShopRequest,
  CreateShopFormData,
  UpdateShopFormData,
} from './types/shop.types';
export { createShopSchema, updateShopSchema, SHOP_STATUS_LABELS } from './types/shop.types';

// Decoration (Shop Decoration block builder)
export { ShopDecorationRenderer } from './components/decoration/ShopDecorationRenderer';
export type {
  DecorationConfig,
  DecorationTheme,
  Block,
  AnyBlock,
  BlockType,
  BlockDataMap,
  HeroBlockData,
  RichTextBlockData,
  ImageBlockData,
  ProductGridBlockData,
} from './types/decoration.types';
export {
  decorationConfigSchema,
  parseDecorationConfig,
  DECORATION_LIMITS,
  DECORATION_VERSION,
  BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
} from './types/decoration.types';
