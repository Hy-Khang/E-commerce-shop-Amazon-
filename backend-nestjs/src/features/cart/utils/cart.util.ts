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
        option1: item.product_variant.option1,
        option2: item.product_variant.option2,
        option1_label: item.product_variant.product?.option1_label ?? null,
        option2_label: item.product_variant.product?.option2_label ?? null,
        stock_quantity: item.product_variant.stock_quantity,
        product_name: item.product_variant.product?.name ?? '',
        thumbnail_url: item.product_variant.product?.thumbnail_url ?? null,
      },
    })),
  };
}
