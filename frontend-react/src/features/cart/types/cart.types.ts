export interface CartVariant {
  sku: string;
  option1: string | null;
  option2: string | null;
  option1_label: string | null;
  option2_label: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  product_name: string;
  thumbnail_url: string | null;
}

export interface CartItem {
  id: number;
  product_variant_id: number;
  quantity: number;
  variant: CartVariant;
}

export interface Cart {
  id: number;
  items: CartItem[];
}

export interface AddToCartRequest {
  product_variant_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface MergeCartRequest {
  session_id: string;
}
