import { useCallback, useState } from 'react';

export type DashboardSectionKey =
  | 'performance'
  | 'orders'
  | 'marketplace'
  | 'inventory';

export interface DashboardSectionMeta {
  key: DashboardSectionKey;
  label: string;
}

export const DASHBOARD_SECTIONS: DashboardSectionMeta[] = [
  { key: 'performance', label: 'Performance' },
  { key: 'orders', label: 'Orders' },
  { key: 'marketplace', label: 'Marketplace & Users' },
  { key: 'inventory', label: 'Inventory' },
];

export type SectionVisibility = Record<DashboardSectionKey, boolean>;

const STORAGE_KEY = 'admin-dashboard-visible-sections';

const ALL_VISIBLE: SectionVisibility = {
  performance: true,
  orders: true,
  marketplace: true,
  inventory: true,
};

function readStored(): SectionVisibility {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ALL_VISIBLE;
    const parsed = JSON.parse(raw) as Partial<SectionVisibility>;
    // Merge over defaults so a newly added section defaults to visible.
    return { ...ALL_VISIBLE, ...parsed };
  } catch {
    return ALL_VISIBLE;
  }
}

/**
 * Per-admin show/hide state for the dashboard's module sections, persisted to
 * localStorage. Falls back to all-visible when storage is empty/unavailable.
 */
export function useDashboardSections() {
  const [visible, setVisible] = useState<SectionVisibility>(readStored);

  const toggle = useCallback((key: DashboardSectionKey) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore write failures (private mode, storage disabled).
      }
      return next;
    });
  }, []);

  return { visible, toggle };
}
