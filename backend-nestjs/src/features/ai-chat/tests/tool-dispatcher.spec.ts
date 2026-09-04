import { ForbiddenException } from '@nestjs/common';
import { ToolDispatcher } from '../tools/tool-dispatcher';
import { AGENT_TOOL_NAMES } from '../tools/agent-tools';

describe('ToolDispatcher', () => {
  let dispatcher: ToolDispatcher;
  let productService: any;
  let cartService: any;
  let orderService: any;
  let userProfileService: any;
  let couponService: any;

  const customer = { userId: 5, sessionId: null } as const;
  const guest = { userId: null, sessionId: 's1' } as const;

  beforeEach(() => {
    productService = {
      findActiveProducts: jest.fn().mockResolvedValue({
        data: [
          {
            id: 1,
            name: 'Áo',
            slug: 'ao',
            variants: [
              { id: 11, price: 100, sale_price: null, stock_quantity: 3 },
            ],
          },
        ],
        meta: {},
      }),
      findActiveByIds: jest.fn(),
    };
    cartService = {
      addItem: jest.fn().mockResolvedValue({ id: 9, items: [] }),
      getCart: jest.fn().mockResolvedValue({ id: 9, items: [] }),
      updateItemQuantity: jest.fn().mockResolvedValue({ id: 9, items: [] }),
      removeItem: jest.fn().mockResolvedValue(undefined),
    };
    orderService = {
      previewCheckout: jest.fn().mockResolvedValue({
        subtotal: 100,
        discount_total: 0,
        coin_discount: 0,
        coins_applied: 0,
        shipping_total: 0,
        grand_total: 100,
        shops: [],
        applied_coupons: [],
      }),
      checkout: jest.fn(),
      findMyOrders: jest.fn().mockResolvedValue({ data: [], meta: {} }),
      findMyOrderById: jest.fn(),
      cancelOrder: jest.fn(),
    };
    userProfileService = { findAllAddresses: jest.fn().mockResolvedValue([]) };
    couponService = {
      getAvailableCouponsForCart: jest.fn().mockResolvedValue({
        platform: [
          {
            code: 'SALE10',
            description: null,
            discount_type: 'percentage',
            discount_value: 10,
            min_order_amount: null,
            discount_preview: 10,
            eligible: true,
          },
        ],
        shops: [],
      }),
    };

    dispatcher = new ToolDispatcher(
      productService,
      cartService,
      orderService,
      userProfileService,
      couponService,
    );
  });

  it('search_products resolves an exact product name on the first (precise) tier', async () => {
    // Only the full-name query matches; broad tokens ("áo") would return a
    // different set. The precise tier must win and not fall through.
    productService.findActiveProducts.mockImplementation((f: any) =>
      Promise.resolve({
        data:
          f.search === 'Áo thun Seventy Seven 04'
            ? [{ id: 27, name: 'Áo thun Seventy Seven 04', variants: [] }]
            : [{ id: 1, name: 'Áo khác', variants: [] }],
        meta: {},
      }),
    );

    const res = await dispatcher.run(
      AGENT_TOOL_NAMES.SEARCH_PRODUCTS,
      { query: 'Áo thun Seventy Seven 04' },
      guest,
    );

    expect((res.content as any).products[0].id).toBe(27);
    // Tier 1 hit → no broad-token fan-out.
    expect(productService.findActiveProducts).toHaveBeenCalledTimes(1);
  });

  it('search_products falls back to the attribute-stripped phrase when the full query misses', async () => {
    // "áo thun nam oversize đen" as one LIKE misses (đen is a variant attr);
    // the stripped phrase "áo thun nam oversize" then matches.
    productService.findActiveProducts.mockImplementation((f: any) =>
      Promise.resolve({
        data:
          f.search === 'áo thun nam oversize'
            ? [{ id: 5, name: 'Áo thun nam oversize', variants: [] }]
            : [],
        meta: {},
      }),
    );

    const res = await dispatcher.run(
      AGENT_TOOL_NAMES.SEARCH_PRODUCTS,
      { query: 'áo thun nam oversize đen' },
      guest,
    );

    expect((res.content as any).products[0].id).toBe(5);
  });

  it('add_to_cart executes the cart service and returns a cart_updated action', async () => {
    const res = await dispatcher.run(
      AGENT_TOOL_NAMES.ADD_TO_CART,
      { product_variant_id: 11, quantity: 2 },
      customer,
    );

    expect(cartService.addItem).toHaveBeenCalledWith(
      { userId: 5 },
      { product_variant_id: 11, quantity: 2 },
    );
    expect(res.action?.type).toBe('cart_updated');
  });

  it('add_to_cart works for a guest (session owner)', async () => {
    await dispatcher.run(
      AGENT_TOOL_NAMES.ADD_TO_CART,
      { product_variant_id: 11, quantity: 1 },
      guest,
    );
    expect(cartService.addItem).toHaveBeenCalledWith(
      { sessionId: 's1' },
      expect.objectContaining({ product_variant_id: 11 }),
    );
  });

  it('propose_checkout only previews — never charges money', async () => {
    const res = await dispatcher.run(
      AGENT_TOOL_NAMES.PROPOSE_CHECKOUT,
      { coins_to_redeem: 50 },
      customer,
    );

    expect(orderService.previewCheckout).toHaveBeenCalledWith(5, {
      coins_to_redeem: 50,
    });
    expect(orderService.checkout).not.toHaveBeenCalled();
    expect(res.action?.type).toBe('checkout_proposal');
  });

  it('gates checkout/orders behind login for guests (needs_login, no service call)', async () => {
    const checkout = await dispatcher.run(
      AGENT_TOOL_NAMES.PROPOSE_CHECKOUT,
      {},
      guest,
    );
    const orders = await dispatcher.run(
      AGENT_TOOL_NAMES.LIST_ORDERS,
      {},
      guest,
    );

    expect(checkout.action?.type).toBe('needs_login');
    expect(orders.action?.type).toBe('needs_login');
    expect(orderService.previewCheckout).not.toHaveBeenCalled();
    expect(orderService.findMyOrders).not.toHaveBeenCalled();
  });

  it('catches a service error and returns it to the model (never throws)', async () => {
    orderService.cancelOrder.mockRejectedValue(
      new ForbiddenException({ code: 'ORDER_004', message: 'not yours' }),
    );

    const res = await dispatcher.run(
      AGENT_TOOL_NAMES.CANCEL_ORDER,
      { order_id: 7 },
      customer,
    );

    expect((res.content as any).error.code).toBe('ORDER_004');
  });

  it('list_coupons returns available vouchers for a customer', async () => {
    const res = await dispatcher.run(
      AGENT_TOOL_NAMES.LIST_COUPONS,
      {},
      customer,
    );
    expect(couponService.getAvailableCouponsForCart).toHaveBeenCalledWith(5);
    expect((res.content as any).platform[0].code).toBe('SALE10');
  });

  it('list_coupons is gated behind login for guests (no service call)', async () => {
    const res = await dispatcher.run(AGENT_TOOL_NAMES.LIST_COUPONS, {}, guest);
    expect(res.action?.type).toBe('needs_login');
    expect(couponService.getAvailableCouponsForCart).not.toHaveBeenCalled();
  });

  it('answers policy FAQ from static content (no service)', async () => {
    const res = await dispatcher.run(
      AGENT_TOOL_NAMES.GET_POLICIES,
      { topic: 'returns' },
      guest,
    );
    expect((res.content as any).answer).toMatch(/đổi trả|7 ngày/i);
  });
});
