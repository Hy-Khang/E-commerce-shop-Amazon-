import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import { useAiConfig, useSendAiMessage } from './useAiChat';
import { useAiChatStore } from '../stores/ai-chat.store';

vi.mock('../services/ai-chat.service', () => ({
  aiChatService: {
    getConfig: vi.fn(),
    sendMessage: vi.fn(),
  },
}));

import { aiChatService } from '../services/ai-chat.service';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { wrapper: Wrapper };
}

describe('useAiConfig', () => {
  beforeEach(() => vi.clearAllMocks());

  it('exposes the enabled flag', async () => {
    (aiChatService.getConfig as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { data: { enabled: true } },
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAiConfig(), { wrapper });

    await waitFor(() => expect(result.current.data?.enabled).toBe(true));
  });
});

describe('useSendAiMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAiChatStore.setState({ conversationId: null, messages: [] });
  });

  it('optimistically appends the user + assistant turns and fills the reply', async () => {
    (aiChatService.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        data: {
          conversation_id: 42,
          reply: 'Đây là gợi ý của mình.',
          products: [],
        },
      },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendAiMessage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('tìm áo thun');
    });

    const messages = useAiChatStore.getState().messages;
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: 'user', content: 'tìm áo thun' });
    expect(messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Đây là gợi ý của mình.',
      pending: false,
    });
    expect(useAiChatStore.getState().conversationId).toBe(42);
  });

  it('fills a friendly error into the assistant bubble on failure', async () => {
    (aiChatService.sendMessage as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: { status: 429 },
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useSendAiMessage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('spam').catch(() => {});
    });

    const messages = useAiChatStore.getState().messages;
    expect(messages).toHaveLength(2);
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].pending).toBe(false);
    expect(messages[1].content).toMatch(/quá nhanh/i);
  });
});
