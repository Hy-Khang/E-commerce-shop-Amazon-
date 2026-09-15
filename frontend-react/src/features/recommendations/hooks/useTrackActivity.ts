import { useCallback, useEffect, useRef } from 'react';
import { recommendationsService } from '../services/recommendations.service';
import type { TrackActivityRequest } from '../types/recommendations.types';

/** Fire-and-forget POST /activity — best-effort, never surfaced to the user. */
function send(body: TrackActivityRequest): void {
  recommendationsService.track(body).catch(() => {
    // analytics signal — swallow all failures
  });
}

/**
 * Records a behavioral signal once per distinct signal (`action:target_id`).
 * Pass a signal to auto-fire on mount/change (e.g. VIEW_PRODUCT on a detail page).
 * Modeled on `useTrackView`'s fire-once ref guard.
 */
export function useTrackActivity(signal?: TrackActivityRequest) {
  const firedRef = useRef<string | null>(null);
  const key = signal
    ? `${signal.action}:${signal.target_id ?? ''}`
    : null;

  useEffect(() => {
    if (!signal || !key || firedRef.current === key) return;
    firedRef.current = key;
    send(signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * Imperative tracker for event-driven signals (add-to-cart, wishlist, search
 * submit) fired from handlers rather than on mount.
 */
export function useTrackActivityCallback() {
  return useCallback((body: TrackActivityRequest) => send(body), []);
}
