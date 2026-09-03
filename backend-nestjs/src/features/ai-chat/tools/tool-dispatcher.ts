import { Injectable, Logger } from '@nestjs/common';
import { ProductService } from '../../product/product.service';
import { CartService } from '../../cart/cart.service';
import { OrderService } from '../../order/order.service';
import { UserProfileService } from '../../user-profile/user-profile.service';
import { CouponService } from '../../coupon/coupon.service';
import { ICartOwner } from '../../cart/types/cart.types';
import { CartResponseDto } from '../../cart/dto/cart-response.dto';
import { Product } from '../../product/entities/product.entity';
import { AiChatOwner, ToolDispatchResult } from '../types/ai-chat.types';
import { AGENT_TOOL_NAMES, POLICY_FAQ } from './agent-tools';
import { extractKeywords, parsePriceHint } from '../utils/ai-chat.util';

/**
 * Executes a single agent tool call against the real feature services.
 *
 * Security: the caller's identity (`owner`) always comes from the request
 * (JWT / x-session-id) — never from tool arguments. Guest-gated tools
 * (checkout / orders / addresses need a logged-in user) short-circuit with
 * `{ needs_login: true }` instead of touching a service. Any service error is
 * caught and returned to the model as `{ error: { code, message } }` so one bad
 * tool call never throws out of the loop.
 */
@Injectable()
export class ToolDispatcher {
  private readonly logger = new Logger(ToolDispatcher.name);

  constructor(
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly userProfileService: UserProfileService,
    private readonly couponService: CouponService,
  ) {}

  async run(
    name: string,
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    try {
      // NOTE: `return await` (not bare `return`) so a rejected service promise is
      // caught here and surfaced to the model as { error }, never thrown out.
      switch (name) {
        case AGENT_TOOL_NAMES.SEARCH_PRODUCTS:
          return await this.searchProducts(args);
        case AGENT_TOOL_NAMES.VIEW_CART:
          return await this.viewCart(owner);
        case AGENT_TOOL_NAMES.ADD_TO_CART:
          return await this.addToCart(args, owner);
        case AGENT_TOOL_NAMES.UPDATE_CART_ITEM:
          return await this.updateCartItem(args, owner);
        case AGENT_TOOL_NAMES.REMOVE_CART_ITEM:
          return await this.removeCartItem(args, owner);
        case AGENT_TOOL_NAMES.LIST_COUPONS:
          return await this.listCoupons(owner);
        case AGENT_TOOL_NAMES.PROPOSE_CHECKOUT:
          return await this.proposeCheckout(args, owner);
        case AGENT_TOOL_NAMES.LIST_ORDERS:
          return await this.listOrders(args, owner);
        case AGENT_TOOL_NAMES.GET_ORDER:
          return await this.getOrder(args, owner);
        case AGENT_TOOL_NAMES.LIST_ADDRESSES:
          return await this.listAddresses(owner);
        case AGENT_TOOL_NAMES.CANCEL_ORDER:
          return await this.cancelOrder(args, owner);
        case AGENT_TOOL_NAMES.GET_POLICIES:
          return this.getPolicies(args);
        case AGENT_TOOL_NAMES.ASK_CHOICE:
          return this.askChoice(args);
        default:
          return {
            content: {
              error: { code: 'TOOL_UNKNOWN', message: `Unknown tool ${name}` },
            },
          };
      }
    } catch (err: any) {
      const resp = err?.response;
      const code = resp?.code ?? 'TOOL_ERROR';
      const message = resp?.message ?? err?.message ?? 'Tool execution failed';
      this.logger.warn(`Tool ${name} failed: ${code} — ${message}`);
      return { content: { error: { code, message } } };
    }
  }

  // ─── Read tools ───

  private async searchProducts(
    args: Record<string, any>,
  ): Promise<ToolDispatchResult> {
    const query = String(args.query ?? '').trim();

    // The catalog matches `search` as a SINGLE `product.name LIKE %term%`, so
    // two things break a naïve search: (a) colour/size are variant attributes
    // (product_variants.option*) never present in the name, so "áo thun nam
    // oversize đen" as one LIKE finds nothing; (b) a broad token like "áo"
    // returns many rows and, in a keyword UNION, crowds out the specific product
    // ("Áo thun Seventy Seven 04"). So we go PRECISE → BROAD and return at the
    // first tier that hits: exact/substring name → attribute-stripped phrase →
    // union of individual keywords (last resort). A price phrase in the query
    // ("dưới 300k") becomes a bound; explicit args win.
    const priceHint = parsePriceHint(query);
    const minPrice =
      args.min_price != null ? Number(args.min_price) : priceHint.min_price;
    const maxPrice =
      args.max_price != null ? Number(args.max_price) : priceHint.max_price;

    const runSearch = (search?: string): Promise<Product[]> =>
      this.productService
        .findActiveProducts({
          page: 1,
          limit: 6,
          search: search || undefined,
          ...(minPrice != null && { min_price: minPrice }),
          ...(maxPrice != null && { max_price: maxPrice }),
        })
        .then((r) => r.data)
        .catch(() => [] as Product[]);

    let data: Product[] = [];
    if (!query) {
      data = await runSearch(undefined);
    } else {
      // 1) Exact / substring product-name match — resolves "Áo thun Seventy
      //    Seven 04" straight to that product.
      data = await runSearch(query);

      if (data.length === 0) {
        // 2) Strip trailing attribute/filler words (colour/size/price) and retry
        //    as a contiguous phrase — "áo thun nam oversize đen" → "áo thun nam
        //    oversize" still LIKE-matches the product name.
        const keywords = extractKeywords(query);
        if (keywords.length) {
          data = await runSearch(keywords.join(' '));

          // 3) Last resort: union individual keywords (broadest — a distinctive
          //    token still surfaces something even if the phrase missed).
          if (data.length === 0) {
            const seen = new Set<number>();
            for (const kw of keywords) {
              for (const p of await runSearch(kw)) {
                if (seen.has(p.id)) continue;
                seen.add(p.id);
                data.push(p);
                if (data.length >= 6) break;
              }
              if (data.length >= 6) break;
            }
          }
        }
      }
    }

    const top = data.slice(0, 6);
    const products = top.map((p) => this.toProductPayload(p));
    return {
      content: { count: products.length, products },
      productIds: top.map((p) => p.id),
    };
  }

  private async viewCart(owner: AiChatOwner): Promise<ToolDispatchResult> {
    const cart = await this.cartService.getCart(this.toCartOwner(owner));
    return { content: this.toCartPayload(cart) };
  }

  private async listOrders(
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    if (owner.userId == null) return this.needsLogin('list_orders');
    const result = await this.orderService.findMyOrders(owner.userId, {
      page: 1,
      limit: 10,
      ...(args.status && { status: args.status }),
    });
    const orders = result.data.map((o: any) => ({
      id: o.id,
      status: o.status,
      payment_status: o.payment_status,
      payment_method: o.payment_method,
      shop_name: o.shop_name,
      total_amount: Number(o.total_amount),
      created_at: o.created_at,
    }));
    return { content: { count: orders.length, orders } };
  }

  private async getOrder(
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    if (owner.userId == null) return this.needsLogin('get_order');
    const orderId = Number(args.order_id);
    const order: any = await this.orderService.findMyOrderById(
      owner.userId,
      orderId,
    );
    return {
      content: {
        id: order.id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        shop_name: order.shop_name,
        total_amount: Number(order.total_amount),
        discount_amount: Number(order.discount_amount ?? 0),
        coin_discount: Number(order.coin_discount ?? 0),
        shipping_fee: Number(order.shipping_fee ?? 0),
        created_at: order.created_at,
        items: (order.order_items ?? []).map((it: any) => ({
          product_name: it.product_name,
          quantity: it.quantity,
          price: Number(it.price),
        })),
      },
    };
  }

  private async listAddresses(owner: AiChatOwner): Promise<ToolDispatchResult> {
    if (owner.userId == null) return this.needsLogin('list_addresses');
    const addresses = await this.userProfileService.findAllAddresses(
      owner.userId,
    );
    return {
      content: {
        count: addresses.length,
        addresses: addresses.map((a) => ({
          id: a.id,
          full_name: a.full_name,
          phone: a.phone,
          address_line: a.address_line,
          city: a.city,
          is_default: a.is_default,
        })),
      },
    };
  }

  private getPolicies(args: Record<string, any>): ToolDispatchResult {
    const topic = String(args.topic ?? 'general').toLowerCase();
    const answer = POLICY_FAQ[topic] ?? POLICY_FAQ.general;
    return { content: { topic, answer } };
  }

  /**
   * Render quick-reply chips (no side effect, guest-safe). Each option is a
   * complete message the customer sends when they tap it — used for variant
   * choices (colour/size) or picking a coupon, so they don't have to type.
   */
  private askChoice(args: Record<string, any>): ToolDispatchResult {
    const question = String(args.question ?? '').trim();
    const options = (Array.isArray(args.options) ? args.options : [])
      .map((o: any) => String(o ?? '').trim())
      .filter((o: string) => o.length > 0)
      .slice(0, 8)
      .map((o: string) => ({ label: o, value: o }));
    if (options.length === 0) {
      return {
        content: {
          error: {
            code: 'ASK_CHOICE_EMPTY',
            message: 'No options provided for ask_choice',
          },
        },
      };
    }
    return {
      content: { shown: true, options: options.map((o) => o.value) },
      action: {
        type: 'quick_replies',
        data: { ...(question && { prompt: question }), options },
      },
    };
  }

  private async listCoupons(owner: AiChatOwner): Promise<ToolDispatchResult> {
    if (owner.userId == null) return this.needsLogin('list_coupons');
    const available = await this.couponService.getAvailableCouponsForCart(
      owner.userId,
    );
    const toOption = (c: any) => ({
      code: c.code,
      description: c.description ?? null,
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      min_order_amount:
        c.min_order_amount != null ? Number(c.min_order_amount) : null,
      discount_preview: Number(c.discount_preview ?? 0),
      eligible: c.eligible,
      ...(c.reason && { reason: c.reason }),
      ...(c.short_of_min != null && { short_of_min: Number(c.short_of_min) }),
    });
    return {
      content: {
        note: 'Đây là voucher đang có cho giỏ hàng. eligible=false nghĩa là chưa đủ điều kiện (xem reason). Khi khách chọn mã, hãy truyền code vào propose_checkout.coupon_codes.',
        platform: (available.platform ?? []).map(toOption),
        shops: (available.shops ?? []).map((s) => ({
          shop_id: s.shop_id,
          shop_name: s.shop_name,
          coupons: (s.coupons ?? []).map(toOption),
        })),
      },
    };
  }

  // ─── Cart-write tools (auto, guest + customer) ───

  private async addToCart(
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    const cart = await this.cartService.addItem(this.toCartOwner(owner), {
      product_variant_id: Number(args.product_variant_id),
      quantity: Number(args.quantity),
    });
    const payload = this.toCartPayload(cart);
    return {
      content: { ok: true, cart: payload },
      action: { type: 'cart_updated', data: payload },
    };
  }

  private async updateCartItem(
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    const cart = await this.cartService.updateItemQuantity(
      this.toCartOwner(owner),
      Number(args.item_id),
      { quantity: Number(args.quantity) },
    );
    const payload = this.toCartPayload(cart);
    return {
      content: { ok: true, cart: payload },
      action: { type: 'cart_updated', data: payload },
    };
  }

  private async removeCartItem(
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    const cartOwner = this.toCartOwner(owner);
    await this.cartService.removeItem(cartOwner, Number(args.item_id));
    const cart = await this.cartService.getCart(cartOwner);
    const payload = this.toCartPayload(cart);
    return {
      content: { ok: true, cart: payload },
      action: { type: 'cart_updated', data: payload },
    };
  }

  // ─── Money tool (propose only — never charges) ───

  private async proposeCheckout(
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    if (owner.userId == null) return this.needsLogin('propose_checkout');

    const couponCodes: string[] | undefined = Array.isArray(args.coupon_codes)
      ? args.coupon_codes.map((c: any) => String(c))
      : undefined;
    const coinsToRedeem =
      args.coins_to_redeem != null ? Number(args.coins_to_redeem) : undefined;

    const preview = await this.orderService.previewCheckout(owner.userId, {
      ...(couponCodes && { coupon_codes: couponCodes }),
      ...(coinsToRedeem != null && { coins_to_redeem: coinsToRedeem }),
    });

    const proposal = {
      preview,
      coupon_codes: couponCodes ?? [],
      coins_to_redeem: coinsToRedeem ?? 0,
    };
    return {
      // The model sees the totals but is told NOT to claim the order is placed.
      content: {
        proposal_ready: true,
        note: 'Đây chỉ là bảng tạm tính. Khách phải bấm nút xác nhận để đặt hàng — bạn KHÔNG được nói đơn đã được đặt.',
        totals: {
          subtotal: preview.subtotal,
          discount_total: preview.discount_total,
          coin_discount: preview.coin_discount,
          coins_applied: preview.coins_applied,
          shipping_total: preview.shipping_total,
          grand_total: preview.grand_total,
        },
      },
      action: { type: 'checkout_proposal', data: proposal },
    };
  }

  // ─── Order-write tool (pending only) ───

  private async cancelOrder(
    args: Record<string, any>,
    owner: AiChatOwner,
  ): Promise<ToolDispatchResult> {
    if (owner.userId == null) return this.needsLogin('cancel_order');
    const order: any = await this.orderService.cancelOrder(
      owner.userId,
      Number(args.order_id),
    );
    return {
      content: { ok: true, order_id: order.id, status: order.status },
      action: {
        type: 'order_cancelled',
        data: { order_id: order.id, status: order.status },
      },
    };
  }

  // ─── Helpers ───

  private needsLogin(tool: string): ToolDispatchResult {
    return {
      content: {
        needs_login: true,
        message:
          'Khách cần đăng nhập để dùng tính năng này. Hãy mời khách đăng nhập.',
      },
      action: { type: 'needs_login', data: { tool } },
    };
  }

  private toCartOwner(owner: AiChatOwner): ICartOwner {
    return owner.userId != null
      ? { userId: owner.userId }
      : { sessionId: owner.sessionId };
  }

  private toProductPayload(p: Product) {
    const variants = (p.variants ?? []).map((v) => ({
      product_variant_id: v.id,
      option1: v.option1,
      option2: v.option2,
      price: Number(v.sale_price ?? v.price),
      original_price: Number(v.price),
      stock: v.stock_quantity,
    }));
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      option1_label: p.option1_label,
      option2_label: p.option2_label,
      shop: p.shop?.name ?? null,
      category: p.category?.name ?? null,
      variants,
    };
  }

  private toCartPayload(cart: CartResponseDto) {
    const items = (cart.items ?? []).map((it) => {
      const unit = Number(
        it.variant.flash_price ?? it.variant.sale_price ?? it.variant.price,
      );
      return {
        item_id: it.id,
        product_variant_id: it.product_variant_id,
        product_name: it.variant.product_name,
        option1: it.variant.option1,
        option2: it.variant.option2,
        quantity: it.quantity,
        unit_price: unit,
        line_total: unit * it.quantity,
        shop_name: it.shop_name,
      };
    });
    const subtotal = items.reduce((s, it) => s + it.line_total, 0);
    return { cart_id: cart.id, item_count: items.length, subtotal, items };
  }
}
