import { FlashSale } from '../entities/flash-sale.entity';
import { FlashSaleItem } from '../entities/flash-sale-item.entity';
import {
  FlashSaleItemResponseDto,
  FlashSaleResponseDto,
} from '../dto/flash-sale-response.dto';

function soldPercent(sold: number, quantity: number): number {
  if (!quantity || quantity <= 0) return 0;
  return Math.min(100, Math.round((sold / quantity) * 100));
}

export function toFlashSaleItemResponse(
  item: FlashSaleItem,
): FlashSaleItemResponseDto {
  const variant = item.product_variant;
  const product = variant?.product;

  return {
    id: item.id,
    product_variant_id: item.product_variant_id,
    flash_price: Number(item.flash_price),
    flash_quantity: item.flash_quantity,
    sold_quantity: item.sold_quantity,
    sold_percent: soldPercent(item.sold_quantity, item.flash_quantity),
    shop_id: item.shop_id,
    shop_name: item.shop?.name ?? null,
    status: item.status,
    reject_reason: item.reject_reason ?? null,
    product_id: product?.id ?? null,
    product_name: product?.name ?? null,
    product_slug: product?.slug ?? null,
    thumbnail_url: product?.thumbnail_url ?? null,
    sku: variant?.sku ?? null,
    original_price: variant?.price != null ? Number(variant.price) : null,
    variant_option1_label: product?.option1_label ?? null,
    variant_option1_value: variant?.option1 ?? null,
    variant_option2_label: product?.option2_label ?? null,
    variant_option2_value: variant?.option2 ?? null,
  };
}

export function toFlashSaleResponse(sale: FlashSale): FlashSaleResponseDto {
  const items = (sale.items ?? []).map(toFlashSaleItemResponse);
  return {
    id: sale.id,
    name: sale.name,
    registration_starts_at: sale.registration_starts_at,
    registration_ends_at: sale.registration_ends_at,
    starts_at: sale.starts_at,
    ends_at: sale.ends_at,
    min_discount_percent: Number(sale.min_discount_percent),
    status: sale.status,
    is_active: sale.is_active,
    item_count: items.length,
    pending_count: items.filter((i) => i.status === 'pending').length,
    items,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
  };
}
