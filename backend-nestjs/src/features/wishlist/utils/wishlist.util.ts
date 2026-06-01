import { WishlistItem } from '../entities/wishlist-item.entity';
import { WishlistItemResponseDto } from '../dto/wishlist-response.dto';

export function toWishlistItemResponse(
  item: WishlistItem,
  priceInfo?: { min_price: number | null; min_sale_price: number | null },
): WishlistItemResponseDto {
  return {
    product_id: item.product_id,
    product_name: item.product?.name ?? '',
    product_slug: item.product?.slug ?? '',
    product_thumbnail_url: item.product?.thumbnail_url ?? null,
    product_is_active: item.product?.is_active ?? false,
    min_price: priceInfo?.min_price ?? null,
    min_sale_price: priceInfo?.min_sale_price ?? null,
    added_at: item.created_at,
  };
}
