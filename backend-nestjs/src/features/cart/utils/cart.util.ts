import { Cart } from '../entities/cart.entity';
import { CartResponseDto } from '../dto/cart-response.dto';
import { ProductImage } from '../../product/entities/product-image.entity';

export function pickVariantThumbnail(
  images: ProductImage[] | undefined,
  option1: string | null,
  fallback: string | null,
): string | null {
  if (!images?.length) return fallback;

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  if (option1) {
    const variantImage = sorted.find((img) => img.variant_option1 === option1);
    if (variantImage) return variantImage.image_url;
  }

  const sharedImage = sorted.find((img) => img.variant_option1 === null);
  if (sharedImage) return sharedImage.image_url;

  return fallback;
}

export function toCartResponse(cart: Cart): CartResponseDto {
  return {
    id: cart.id,
    items: (cart.items || []).map((item) => ({
      id: item.id,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
      shop_id: item.product_variant.product?.shop_id ?? null,
      shop_name: item.product_variant.product?.shop?.name ?? null,
      variant: {
        sku: item.product_variant.sku,
        price: item.product_variant.price,
        sale_price: item.product_variant.sale_price,
        option1: item.product_variant.option1,
        option2: item.product_variant.option2,
        option1_label: item.product_variant.product?.option1_label ?? null,
        option2_label: item.product_variant.product?.option2_label ?? null,
        stock_quantity: item.product_variant.stock_quantity,
        product_name: item.product_variant.product?.name ?? '',
        thumbnail_url: pickVariantThumbnail(
          item.product_variant.product?.images,
          item.product_variant.option1,
          item.product_variant.product?.thumbnail_url ?? null,
        ),
      },
    })),
  };
}
