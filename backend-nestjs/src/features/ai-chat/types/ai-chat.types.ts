/** Resolved owner of an AI Chatbox thread — a logged-in customer or a guest. */
export type AiChatOwner =
  | { userId: number; sessionId: null }
  | { userId: null; sessionId: string };

export const AiMessageRole = {
  User: 'user',
  Assistant: 'assistant',
} as const;
export type AiMessageRoleType =
  (typeof AiMessageRole)[keyof typeof AiMessageRole];

/** A function/tool call the model asks the backend to run (OpenAI format). */
export interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

/**
 * One message in the LLM chat-completion request. Extended for tool-calling:
 * an `assistant` turn may carry `tool_calls`; a `tool` turn returns a result
 * keyed by `tool_call_id` (both standard OpenAI/OpenRouter shapes).
 */
export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

/** Result of one LLM call — either final content or a batch of tool calls. */
export interface LlmResult {
  content: string | null;
  tool_calls?: ToolCall[];
}

export interface ChatbotConfig {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  /** Tool-capable model for the agent loop (falls back to chatModel). */
  agentModel: string;
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

/** Max LLM rounds per user message — caps cost and stops runaway tool loops. */
export const MAX_TOOL_ROUNDS = 4;

/** A user-facing action card the agent produced (rendered under the reply). */
export type AgentActionType =
  | 'cart_updated'
  | 'checkout_proposal'
  | 'order_cancelled'
  | 'needs_login'
  | 'quick_replies';

export interface AgentAction {
  type: AgentActionType;
  data: unknown;
}

/** What `ToolDispatcher.run` returns for a single tool call. */
export interface ToolDispatchResult {
  /** JSON-serialisable payload fed back to the model as the tool result. */
  content: unknown;
  /** Optional card surfaced to the frontend. */
  action?: AgentAction;
  /** Product ids to hydrate as cards in the final response. */
  productIds?: number[];
}
