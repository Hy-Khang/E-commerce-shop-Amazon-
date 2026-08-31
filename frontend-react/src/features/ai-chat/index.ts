// Storefront widget (mounted in MainLayout)
export { AiChatWidget } from './components/AiChatWidget';

// Hooks
export { useAiConfig, useSendAiMessage, aiChatKeys } from './hooks/useAiChat';
export {
  useAdminAiConversations,
  useAdminAiConversation,
  useAiSettings,
  useUpdateAiSettings,
  adminAiKeys,
} from './hooks/useAdminAiChat';

// Types
export type {
  AiChatMessage,
  AiConfig,
  AiConversationDetail,
  AiConversationSummary,
  AiMessageDetail,
  AiSettings,
  ChatResponse,
} from './types/ai-chat.types';
