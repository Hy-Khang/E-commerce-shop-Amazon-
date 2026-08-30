import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import {
  useConversations,
  useSendMessage,
  chatKeys,
  type MessagesPage,
} from './useChat';
import { useAuthStore } from '@/features/auth';
import type { Conversation, Message } from '../types/chat.types';

vi.mock('../services/chat.service', () => ({
  chatService: {
    getConversations: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

import { chatService } from '../services/chat.service';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper, queryClient };
}

const emptyPage: MessagesPage = {
  data: [],
  meta: { page: 1, limit: 30, total: 0, totalPages: 0 },
};

function serverMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 10,
    conversation_id: 1,
    sender_id: 2,
    sender_type: 'customer',
    content: 'hi',
    status: 'sent',
    created_at: '2026-08-31T10:00:00.000Z',
    ...overrides,
  };
}

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: 2 } as never, isAuthenticated: true });
  });

  it('useConversations fetches the conversation list', async () => {
    const conversations: Conversation[] = [
      {
        id: 1,
        shop_id: 1,
        shop_name: 'Shop A',
        shop_logo_url: null,
        customer_id: 2,
        counterpart_name: 'Shop A',
        last_message_preview: 'hi',
        last_message_at: '2026-08-31T10:00:00.000Z',
        unread_count: 0,
      },
    ];
    vi.mocked(chatService.getConversations).mockResolvedValue({
      data: { data: conversations },
    } as never);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(conversations);
  });

  it('useSendMessage optimistically appends then reconciles with the server message', async () => {
    vi.mocked(chatService.sendMessage).mockResolvedValue({
      data: { data: serverMessage() },
    } as never);

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(chatKeys.messages(1), emptyPage);

    const { result } = renderHook(() => useSendMessage(1), { wrapper });
    result.current.mutate('hi');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cache = queryClient.getQueryData<MessagesPage>(chatKeys.messages(1));
    expect(cache?.data).toHaveLength(1);
    expect(cache?.data[0].id).toBe(10);
    expect(cache?.data[0].content).toBe('hi');
  });

  it('useSendMessage rolls back the optimistic bubble on error', async () => {
    vi.mocked(chatService.sendMessage).mockRejectedValue(new Error('network'));

    const { wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(chatKeys.messages(1), emptyPage);

    const { result } = renderHook(() => useSendMessage(1), { wrapper });
    result.current.mutate('hi');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cache = queryClient.getQueryData<MessagesPage>(chatKeys.messages(1));
    expect(cache?.data).toHaveLength(0);
  });
});
