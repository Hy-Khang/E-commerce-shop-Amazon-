import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import type { Message } from '../types/chat.types';

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 1,
    conversation_id: 1,
    sender_id: 2,
    sender_type: 'customer',
    content: 'Xin chào shop',
    status: 'sent',
    created_at: '2026-08-31T10:00:00.000Z',
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('renders the message content', () => {
    render(<MessageBubble message={makeMessage()} isOwn={false} />);
    expect(screen.getByText('Xin chào shop')).toBeInTheDocument();
  });

  it('shows a status tick only for own messages', () => {
    const { rerender } = render(
      <MessageBubble message={makeMessage({ status: 'read' })} isOwn={false} />,
    );
    // Incoming message: no receipt tick.
    expect(screen.queryByLabelText('Read')).not.toBeInTheDocument();

    rerender(
      <MessageBubble message={makeMessage({ status: 'read' })} isOwn />,
    );
    expect(screen.getByLabelText('Read')).toBeInTheDocument();
  });

  it('reflects the delivery status on own messages', () => {
    const { rerender } = render(
      <MessageBubble message={makeMessage({ status: 'sent' })} isOwn />,
    );
    expect(screen.getByLabelText('Sent')).toBeInTheDocument();

    rerender(
      <MessageBubble message={makeMessage({ status: 'delivered' })} isOwn />,
    );
    expect(screen.getByLabelText('Delivered')).toBeInTheDocument();
  });
});
