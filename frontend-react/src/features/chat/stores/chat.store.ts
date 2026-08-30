import { create } from 'zustand';

interface ChatState {
  /** Total unread messages across all conversations (header badge). */
  unreadTotal: number;
  /** The conversation currently open in the UI (suppresses its own toasts). */
  activeConversationId: number | null;
  /** conversationId → is the counterpart currently typing. */
  typingByConversation: Record<number, boolean>;
  /** conversationId → is the counterpart present in this conversation's room. */
  onlineByConversation: Record<number, boolean>;

  setUnreadTotal: (count: number) => void;
  setActiveConversationId: (id: number | null) => void;
  setTyping: (conversationId: number, isTyping: boolean) => void;
  setConversationOnline: (conversationId: number, online: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  unreadTotal: 0,
  activeConversationId: null,
  typingByConversation: {},
  onlineByConversation: {},

  setUnreadTotal: (count) => set({ unreadTotal: count }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setTyping: (conversationId, isTyping) =>
    set((s) => ({
      typingByConversation: {
        ...s.typingByConversation,
        [conversationId]: isTyping,
      },
    })),
  setConversationOnline: (conversationId, online) =>
    set((s) => ({
      onlineByConversation: {
        ...s.onlineByConversation,
        [conversationId]: online,
      },
    })),
}));
