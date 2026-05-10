import { Cart } from '../entities/cart.entity';
import { CartResponseDto } from '../dto/cart-response.dto';

export function toCartResponse(cart: Cart): CartResponseDto {
  return {
    id: cart.id,
    items: (cart.items || []).map((item) => ({
      id: item.id,
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
      variant: {
        sku: item.product_variant.sku,
        price: item.product_variant.price,
        sale_price: item.product_variant.sale_price,
        color: item.product_variant.color,
        size: item.product_variant.size,
        stock_quantity: item.product_variant.stock_quantity,
        product_name: item.product_variant.product?.name ?? '',
        thumbnail_url: item.product_variant.product?.thumbnail_url ?? null,
      },
    })),
  };
}
