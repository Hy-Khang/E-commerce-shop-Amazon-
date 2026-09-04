import type { IMetricChange } from '../types/dashboard.types';

export type DashboardPeriod = '7d' | '30d' | '90d' | '12m';

export type RevenueGranularity = 'day' | 'month';

export interface ResolvedPeriod {
  days: number;
  granularity: RevenueGranularity;
}

export const DASHBOARD_PERIODS: DashboardPeriod[] = ['7d', '30d', '90d', '12m'];

export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriod = '30d';

/**
 * Maps a period selector value to the query window (in days) and the bucket
 * granularity used by the revenue-over-time chart. Short ranges bucket by day;
 * the 12-month range buckets by calendar month.
 */
export function resolvePeriod(
  period: DashboardPeriod = DEFAULT_DASHBOARD_PERIOD,
): ResolvedPeriod {
  switch (period) {
    case '7d':
      return { days: 7, granularity: 'day' };
    case '90d':
      return { days: 90, granularity: 'day' };
    case '12m':
      return { days: 365, granularity: 'month' };
    case '30d':
    default:
      return { days: 30, granularity: 'day' };
  }
}

/**
 * Builds a period-over-period change from the current and previous window
 * totals. `changePercent` is null when the previous window was zero (no valid
 * baseline → the frontend renders "New" instead of a percentage).
 */
export function computeChange(
  current: number,
  previous: number,
): IMetricChange {
  if (previous <= 0) {
    return {
      changePercent: null,
      direction: current > 0 ? 'up' : 'flat',
    };
  }
  const changePercent = ((current - previous) / previous) * 100;
  const direction =
    changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';
  return { changePercent, direction };
}
