import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTrackActivity } from './useTrackActivity';
import type { TrackActivityRequest } from '../types/recommendations.types';

vi.mock('../services/recommendations.service', () => ({
  recommendationsService: {
    track: vi.fn().mockResolvedValue(undefined),
  },
}));

import { recommendationsService } from '../services/recommendations.service';

const viewProduct = (id: number): TrackActivityRequest => ({
  action: 'VIEW_PRODUCT',
  target_type: 'product',
  target_id: id,
});

describe('useTrackActivity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires the signal once on mount', () => {
    renderHook(() => useTrackActivity(viewProduct(1)));
    expect(recommendationsService.track).toHaveBeenCalledTimes(1);
    expect(recommendationsService.track).toHaveBeenCalledWith(viewProduct(1));
  });

  it('does not re-fire for the same signal across re-renders', () => {
    const { rerender } = renderHook(() => useTrackActivity(viewProduct(1)));
    rerender();
    rerender();
    expect(recommendationsService.track).toHaveBeenCalledTimes(1);
  });

  it('fires again when the signal changes', () => {
    const { rerender } = renderHook(
      ({ id }: { id: number }) => useTrackActivity(viewProduct(id)),
      { initialProps: { id: 1 } },
    );
    rerender({ id: 2 });
    expect(recommendationsService.track).toHaveBeenCalledTimes(2);
    expect(recommendationsService.track).toHaveBeenLastCalledWith(viewProduct(2));
  });

  it('does nothing when no signal is provided (product not loaded yet)', () => {
    renderHook(() => useTrackActivity(undefined));
    expect(recommendationsService.track).not.toHaveBeenCalled();
  });
});
