import type { ProductListItem } from '@/features/product';

/** A message rendered in the storefront widget (client-side shape). */
export interface AiChatMessage {
  /** Client id (temp for optimistic) or `String(server id)`. */
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ProductListItem[];
  pending?: boolean;
}

/** `POST /ai/chat` response. */
export interface ChatResponse {
  conversation_id: number;
  reply: string;
  products: ProductListItem[];
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
