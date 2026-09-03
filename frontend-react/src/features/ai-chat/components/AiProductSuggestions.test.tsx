import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiProductSuggestions } from './AiProductSuggestions';
import type { ProductListItem } from '@/features/product';

vi.mock('@/features/product', () => ({
  ProductCard: ({ product }: { product: { name: string } }) => (
    <div>{product.name}</div>
  ),
}));
vi.mock('../stores/ai-chat.store', () => ({
  useAiChatStore: (sel: (s: { size: string }) => unknown) => sel({ size: 'normal' }),
}));

const products = [
  { id: 1, name: 'Áo thun nam basic cotton' },
  { id: 2, name: 'Áo thun nam oversize' },
] as unknown as ProductListItem[];

describe('AiProductSuggestions', () => {
  it('hands the product to the agent when "Add to cart" is tapped', () => {
    const onPick = vi.fn();
    render(<AiProductSuggestions products={products} onPickSuggestion={onPick} />);

    const buttons = screen.getAllByRole('button', { name: /add to cart/i });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    expect(onPick).toHaveBeenCalledWith('Add "Áo thun nam basic cotton" to my cart');
  });

  it('renders display-only (no action buttons) without a pick handler', () => {
    render(<AiProductSuggestions products={products} />);
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
    expect(screen.getByText('Áo thun nam oversize')).toBeInTheDocument();
  });
});
