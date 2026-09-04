import type { ProductListItem } from '@/features/product';
import type { CheckoutPreview, PaymentMethod } from '@/features/order';

// ─── Agent action cards (Module 21 upgrade → AI Shopping Agent) ───

export interface AiCartSummaryItem {
  item_id: number;
  product_variant_id: number;
  product_name: string;
  option1: string | null;
  option2: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  shop_name: string | null;
}

export interface AiCartSummary {
  cart_id: number;
  item_count: number;
  subtotal: number;
  items: AiCartSummaryItem[];
}

/** Advisory checkout proposal — the customer confirms to actually place it. */
export interface AiCheckoutProposal {
  preview: CheckoutPreview;
  coupon_codes: string[];
  coins_to_redeem: number;
}

/** Order placed from a checkout proposal (client-side, after the customer
 *  confirms). Replaces the `checkout_proposal` card so a completed order never
 *  shows a stale confirm form on resume. */
export interface AiOrderPlaced {
  order_group_id: string;
  payment_method: PaymentMethod;
}

/** A single quick-reply chip — clicking it sends `value` as the next message. */
export interface AiQuickReplyOption {
  label: string;
  value: string;
}

/** A user-facing action card the agent produced (rendered under the reply). */
export type AgentAction =
  | { type: 'cart_updated'; data: AiCartSummary }
  | { type: 'checkout_proposal'; data: AiCheckoutProposal }
  | { type: 'order_placed'; data: AiOrderPlaced }
  | { type: 'order_cancelled'; data: { order_id: number; status: string } }
  | { type: 'needs_login'; data: { tool: string } }
  | {
      type: 'quick_replies';
      data: { prompt?: string; options: AiQuickReplyOption[] };
    };

/** A message rendered in the storefront widget (client-side shape). */
export interface AiChatMessage {
  /** Client id (temp for optimistic) or `String(server id)`. */
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ProductListItem[];
  actions?: AgentAction[];
  pending?: boolean;
}

/** `POST /ai/chat` response. */
export interface ChatResponse {
  conversation_id: number;
  reply: string;
  products: ProductListItem[];
  actions?: AgentAction[];
}

export interface SendMessageRequest {
  message: string;
  conversation_id?: number;
}

export interface AiConfig {
  enabled: boolean;
}

/** One turn as returned by conversation-detail endpoints. */
export interface AiMessageDetail {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  products: ProductListItem[];
  actions?: AgentAction[];
  created_at: string;
}

export interface AiConversationDetail {
  conversation_id: number;
  messages: AiMessageDetail[];
}

/** Admin conversation list row. */
export interface AiConversationSummary {
  id: number;
  user_id: number | null;
  session_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiSettings {
  chatbox_enabled: boolean;
  system_prompt: string | null;
  updated_at: string;
}

export interface UpdateAiSettingsRequest {
  chatbox_enabled?: boolean;
  system_prompt?: string | null;
}
