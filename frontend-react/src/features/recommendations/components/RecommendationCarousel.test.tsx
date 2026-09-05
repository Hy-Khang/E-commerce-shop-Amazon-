import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecommendationCarousel } from './RecommendationCarousel';
import type { ProductListItem } from '@/features/product';

vi.mock('@/features/product', () => ({
  ProductCard: ({ product }: { product: { id: number } }) => (
    <div data-testid="product-card">{product.id}</div>
  ),
  ProductCardSkeleton: () => <div data-testid="skeleton" />,
}));

const products = [{ id: 1 }, { id: 2 }] as ProductListItem[];

describe('RecommendationCarousel', () => {
  it('renders the title, subtitle, and product cards', () => {
    render(
      <RecommendationCarousel
        title="Recommended for You"
        subtitle="Because you like Electronics"
        products={products}
        isLoading={false}
      />,
    );

    expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getByText('Because you like Electronics')).toBeInTheDocument();
    expect(screen.getAllByTestId('product-card')).toHaveLength(2);
  });

  it('renders skeletons while loading', () => {
    render(
      <RecommendationCarousel title="X" products={[]} isLoading={true} />,
    );
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders nothing when empty and not loading', () => {
    const { container } = render(
      <RecommendationCarousel title="X" products={[]} isLoading={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('omits the subtitle when no reason is given', () => {
    render(
      <RecommendationCarousel
        title="Similar Products"
        subtitle={null}
        products={products}
        isLoading={false}
      />,
    );
    expect(screen.getByText('Similar Products')).toBeInTheDocument();
    expect(screen.queryByText('Because you like Electronics')).not.toBeInTheDocument();
  });
});
