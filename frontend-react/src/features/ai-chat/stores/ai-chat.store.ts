import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from '@/features/auth';
import type { AiChatMessage } from '../types/ai-chat.types';

const STORAGE_KEY = 'ai_chat';
const MAX_MESSAGES = 50;

/** Panel size steps (from `sm:` up — mobile is always full-width). */
export type AiPanelSize = 'normal' | 'large' | 'full';
const SIZE_CYCLE: AiPanelSize[] = ['normal', 'large', 'full'];

interface AiChatState {
  isOpen: boolean;
  size: AiPanelSize;
  conversationId: number | null;
  messages: AiChatMessage[];
  /** In-widget login popup (a guest hit a customer-only tool). */
  loginPromptOpen: boolean;
  /** The message to auto-resend once the guest signs in, so the agent
   *  continues the interrupted action (e.g. checkout) without re-asking. */
  pendingIntent: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  cycleSize: () => void;
  setConversationId: (id: number) => void;
  addMessage: (message: AiChatMessage) => void;
  updateMessage: (id: string, patch: Partial<AiChatMessage>) => void;
  removeMessage: (id: string) => void;
  openLoginPrompt: () => void;
  closeLoginPrompt: () => void;
  setPendingIntent: (text: string | null) => void;
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
      size: 'normal',
      conversationId: null,
      messages: [],
      loginPromptOpen: false,
      pendingIntent: null,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      cycleSize: () =>
        set((s) => ({
          size: SIZE_CYCLE[(SIZE_CYCLE.indexOf(s.size) + 1) % SIZE_CYCLE.length],
        })),
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
      openLoginPrompt: () => set({ loginPromptOpen: true }),
      closeLoginPrompt: () => set({ loginPromptOpen: false }),
      setPendingIntent: (text) => set({ pendingIntent: text }),
      reset: () =>
        set({ conversationId: null, messages: [], pendingIntent: null }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        conversationId: s.conversationId,
        messages: s.messages,
        size: s.size,
        // Persisted so an OAuth sign-in (full-page redirect) can still resume the
        // interrupted action after the widget remounts (email login clears it
        // synchronously before this ever matters).
        pendingIntent: s.pendingIntent,
      }),
    },
  ),
);

// Clear the thread on logout so a previous user's conversation never carries into
// the next session — a privacy leak (the persisted messages include checkout
// totals / order ids) and a correctness bug (the stale `conversationId` belongs to
// the old owner → `CHATBOT_003` on the next send). Mirrors `useCoinRedemptionStore`
// / `useAppliedCouponsStore`. Only fires on a true→false transition, so a guest
// thread still carries into a fresh login (the resume-after-login feature).
useAuthStore.subscribe((state, prev) => {
  if (prev.isAuthenticated && !state.isAuthenticated) {
    const s = useAiChatStore.getState();
    if (s.conversationId !== null || s.messages.length > 0 || s.pendingIntent) {
      s.reset();
    }
  }
});
