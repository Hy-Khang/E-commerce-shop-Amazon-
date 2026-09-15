import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiNeedsLoginCard } from './AiNeedsLoginCard';

let authed = false;
const openLoginPrompt = vi.fn();

vi.mock('@/features/auth', () => ({
  useAuthStore: (sel: (s: { isAuthenticated: boolean }) => unknown) =>
    sel({ isAuthenticated: authed }),
}));
vi.mock('../stores/ai-chat.store', () => ({
  useAiChatStore: (sel: (s: { openLoginPrompt: () => void }) => unknown) =>
    sel({ openLoginPrompt }),
}));

describe('AiNeedsLoginCard', () => {
  beforeEach(() => {
    authed = false;
    openLoginPrompt.mockReset();
  });

  it('shows the sign-in prompt for a guest and opens the login popup', () => {
    render(<AiNeedsLoginCard />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(openLoginPrompt).toHaveBeenCalled();
  });

  it('flips to a signed-in success state once authenticated', () => {
    authed = true;
    render(<AiNeedsLoginCard />);
    expect(screen.getByText(/signed in/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
  });
});
