import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DashboardPeriod } from '../types/dashboard.types';

const PERIODS: DashboardPeriod[] = ['7d', '30d', '90d', '12m'];
const DEFAULT_PERIOD: DashboardPeriod = '30d';

function isPeriod(v: string | null): v is DashboardPeriod {
  return v !== null && (PERIODS as string[]).includes(v);
}

/**
 * Reads/writes the dashboard time window from the `?period=` URL param so it
 * survives reload and is shareable. Falls back to 30d for a missing/invalid
 * value. Mirrors the URL-as-state pattern used for admin page size.
 */
export function usePeriodParam(): [
  DashboardPeriod,
  (period: DashboardPeriod) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('period');
  const period = isPeriod(raw) ? raw : DEFAULT_PERIOD;

  const setPeriod = useCallback(
    (next: DashboardPeriod) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set('period', next);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return [period, setPeriod];
}
