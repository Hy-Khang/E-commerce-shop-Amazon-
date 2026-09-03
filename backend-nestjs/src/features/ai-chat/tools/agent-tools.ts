/**
 * Agent tool definitions (OpenAI/OpenRouter `tools[]` function-calling format).
 *
 * These are pure declarations — the actual work is done by `ToolDispatcher`,
 * which maps each tool name to a real feature service (product / cart / order /
 * user-profile). The model only ever *proposes* checkout (`propose_checkout`
 * returns an advisory preview, never charges money); the customer confirms in
 * the widget, which calls the existing `POST /orders`.
 */

export interface AgentToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

export const AGENT_TOOL_NAMES = {
  SEARCH_PRODUCTS: 'search_products',
  VIEW_CART: 'view_cart',
  ADD_TO_CART: 'add_to_cart',
  UPDATE_CART_ITEM: 'update_cart_item',
  REMOVE_CART_ITEM: 'remove_cart_item',
  PROPOSE_CHECKOUT: 'propose_checkout',
  LIST_ORDERS: 'list_orders',
  GET_ORDER: 'get_order',
  LIST_ADDRESSES: 'list_addresses',
  CANCEL_ORDER: 'cancel_order',
  GET_POLICIES: 'get_policies',
} as const;

export const AGENT_TOOLS: AgentToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.SEARCH_PRODUCTS,
      description:
        'Tìm sản phẩm trong kho theo từ khoá và (tuỳ chọn) khoảng giá. Trả về danh sách sản phẩm kèm các biến thể (variant) với product_variant_id — dùng id này khi thêm vào giỏ.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Từ khoá tìm kiếm (tên sản phẩm, loại...)' },
          min_price: { type: 'number', description: 'Giá tối thiểu (VND), tuỳ chọn' },
          max_price: { type: 'number', description: 'Giá tối đa (VND), tuỳ chọn' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.VIEW_CART,
      description: 'Xem giỏ hàng hiện tại của khách (các item, số lượng, tạm tính).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.ADD_TO_CART,
      description:
        'Thêm một biến thể sản phẩm vào giỏ hàng. Cần product_variant_id (lấy từ kết quả search_products) và số lượng.',
      parameters: {
        type: 'object',
        properties: {
          product_variant_id: { type: 'number', description: 'ID biến thể sản phẩm' },
          quantity: { type: 'number', description: 'Số lượng cần thêm (>= 1)' },
        },
        required: ['product_variant_id', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.UPDATE_CART_ITEM,
      description: 'Cập nhật số lượng của một item trong giỏ. Cần item_id (từ view_cart) và số lượng mới.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'number', description: 'ID của cart item (từ view_cart)' },
          quantity: { type: 'number', description: 'Số lượng mới (>= 1)' },
        },
        required: ['item_id', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.REMOVE_CART_ITEM,
      description: 'Xoá một item khỏi giỏ hàng. Cần item_id (từ view_cart).',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'number', description: 'ID của cart item (từ view_cart)' },
        },
        required: ['item_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.PROPOSE_CHECKOUT,
      description:
        'Đề xuất đặt hàng: tính tạm tính đơn hàng (tiền hàng, giảm giá, Xu, phí ship, tổng cộng) cho giỏ hiện tại. KHÔNG tạo đơn — chỉ trả về bảng xác nhận để khách bấm nút đặt hàng. Dùng khi khách muốn thanh toán/đặt hàng.',
      parameters: {
        type: 'object',
        properties: {
          coupon_codes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Mã giảm giá muốn áp dụng (tối đa 1 mã sàn + 1 mã mỗi shop), tuỳ chọn',
          },
          coins_to_redeem: { type: 'number', description: 'Số Xu muốn dùng, tuỳ chọn' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.LIST_ORDERS,
      description: 'Liệt kê các đơn hàng gần đây của khách (tuỳ chọn lọc theo trạng thái).',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            description: 'Lọc theo trạng thái: pending, confirmed, shipping, delivered, completed, return_requested, cancelled',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.GET_ORDER,
      description: 'Xem chi tiết một đơn hàng của khách theo order_id.',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'number', description: 'ID đơn hàng' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.LIST_ADDRESSES,
      description: 'Liệt kê sổ địa chỉ giao hàng của khách (để chọn địa chỉ khi đặt hàng).',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.CANCEL_ORDER,
      description: 'Huỷ một đơn hàng ĐANG CHỜ XỬ LÝ (pending) của khách. Chỉ đơn pending mới huỷ được.',
      parameters: {
        type: 'object',
        properties: {
          order_id: { type: 'number', description: 'ID đơn hàng cần huỷ' },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: AGENT_TOOL_NAMES.GET_POLICIES,
      description:
        'Lấy nội dung chính sách của sàn để trả lời FAQ. topic: returns (đổi trả), shipping (vận chuyển), payment (thanh toán), coupon (mã giảm giá), coins (Hoàn Xu), general (chung).',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'returns | shipping | payment | coupon | coins | general',
          },
        },
        required: ['topic'],
      },
    },
  },
];

/** Static policy FAQ answers keyed by topic (no LLM, no DB). */
export const POLICY_FAQ: Record<string, string> = {
  returns:
    'Chính sách đổi trả: khách có thể yêu cầu trả hàng/hoàn tiền trong vòng 7 ngày kể từ khi nhận hàng (đơn ở trạng thái đã giao). Vào "Đơn hàng của tôi" để yêu cầu trả hàng.',
  shipping:
    'Vận chuyển: đơn được giao bởi shipper của sàn. Khách theo dõi trạng thái và vị trí shipper trong mục "Đơn hàng của tôi". Phí ship hiển thị khi đặt hàng.',
  payment:
    'Thanh toán: hỗ trợ COD (thanh toán khi nhận hàng), VNPay và MoMo. Với VNPay/MoMo, khách được chuyển sang cổng thanh toán sau khi đặt đơn.',
  coupon:
    'Mã giảm giá: có mã toàn sàn và mã của từng shop, áp dụng khi thanh toán. Khách có thể dùng tối đa 1 mã sàn + 1 mã mỗi shop trong cùng một đơn.',
  coins:
    'Hoàn Xu: khách tích Xu khi đơn hoàn thành và dùng Xu để giảm giá ở lần mua sau (1 Xu = 1 ₫). Mỗi đơn được dùng Xu tối đa 50% tiền hàng; Xu hết hạn theo lô sau một thời gian.',
  general:
    'Đây là sàn thương mại điện tử hỗ trợ mua sắm với nhiều cửa hàng. Khách có thể tìm sản phẩm, thêm vào giỏ, dùng mã giảm giá/Xu và đặt hàng ngay trong khung chat này.',
};
