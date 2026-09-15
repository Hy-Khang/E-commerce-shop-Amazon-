import { beforeEach, describe, expect, it } from 'vitest';
import { useCompareStore, MAX_COMPARE } from './compare.store';

const reset = () => useCompareStore.setState({ items: [] });

describe('useCompareStore', () => {
  beforeEach(reset);

  it('adds a product and returns "added"', () => {
    const result = useCompareStore.getState().add(1, 10);
    expect(result).toBe('added');
    expect(useCompareStore.getState().items).toEqual([{ product_id: 1, category_id: 10 }]);
  });

  it('dedupes a product already in the set', () => {
    const { add } = useCompareStore.getState();
    add(1, 10);
    const result = add(1, 10);
    expect(result).toBe('added');
    expect(useCompareStore.getState().items).toHaveLength(1);
  });

  it('locks to the first product’s category', () => {
    const { add } = useCompareStore.getState();
    add(1, 10);
    const result = add(2, 99); // different category
    expect(result).toBe('different_category');
    expect(useCompareStore.getState().items).toHaveLength(1);
  });

  it(`refuses the ${MAX_COMPARE + 1}th product with "full"`, () => {
    const { add } = useCompareStore.getState();
    for (let i = 1; i <= MAX_COMPARE; i++) add(i, 10);
    const result = add(MAX_COMPARE + 1, 10);
    expect(result).toBe('full');
    expect(useCompareStore.getState().items).toHaveLength(MAX_COMPARE);
  });

  it('remove is never blocked by the lock', () => {
    const { add, remove } = useCompareStore.getState();
    add(1, 10);
    add(2, 10);
    remove(1);
    expect(useCompareStore.getState().items).toEqual([{ product_id: 2, category_id: 10 }]);
  });

  it('prune drops ids the server did not return', () => {
    const { add, prune } = useCompareStore.getState();
    add(1, 10);
    add(2, 10);
    prune([2]);
    expect(useCompareStore.getState().items).toEqual([{ product_id: 2, category_id: 10 }]);
  });

  it('prune keeps the same reference when nothing changes', () => {
    const { add, prune } = useCompareStore.getState();
    add(1, 10);
    const before = useCompareStore.getState().items;
    prune([1]);
    expect(useCompareStore.getState().items).toBe(before);
  });
});
