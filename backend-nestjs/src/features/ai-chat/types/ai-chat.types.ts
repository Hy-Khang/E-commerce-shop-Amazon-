/** Resolved owner of an AI Chatbox thread — a logged-in customer or a guest. */
export type AiChatOwner =
  | { userId: number; sessionId: null }
  | { userId: null; sessionId: string };

export const AiMessageRole = {
  User: 'user',
  Assistant: 'assistant',
} as const;
export type AiMessageRoleType = (typeof AiMessageRole)[keyof typeof AiMessageRole];

/** One message in the LLM chat-completion request. */
export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatbotConfig {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
}

/** Compact product projection fed into the RAG context (keeps tokens small). */
export interface ProductContextItem {
  id: number;
  name: string;
  slug: string;
  price_from: number;
  price_to: number;
  category: string | null;
  shop: string | null;
}

export const AI_MESSAGE_MAX_LENGTH = 2000;
export const AI_HISTORY_LIMIT = 10;
export const AI_RETRIEVAL_LIMIT = 6;
