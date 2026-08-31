import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AiChatMessage } from '../types/ai-chat.types';

const STORAGE_KEY = 'ai_chat';
const MAX_MESSAGES = 50;

interface AiChatState {
  isOpen: boolean;
  conversationId: number | null;
  messages: AiChatMessage[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setConversationId: (id: number) => void;
  addMessage: (message: AiChatMessage) => void;
  updateMessage: (id: string, patch: Partial<AiChatMessage>) => void;
  removeMessage: (id: string) => void;
  reset: () => void;
}

/**
 * Storefront chatbox state, persisted to localStorage so a thread survives
 * reloads within a session (guest + customer). Server persists the canonical
 * conversation; this store is the live UI view, trimmed to the newest messages.
 */
export const useAiChatStore = create<AiChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      conversationId: null,
      messages: [],
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setConversationId: (id) => set({ conversationId: id }),
      addMessage: (message) =>
        set((s) => ({
          messages: [...s.messages, message].slice(-MAX_MESSAGES),
        })),
      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      removeMessage: (id) =>
        set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
      reset: () => set({ conversationId: null, messages: [] }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        conversationId: s.conversationId,
        messages: s.messages,
      }),
    },
  ),
);
