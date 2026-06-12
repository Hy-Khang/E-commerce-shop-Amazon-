import { Shield, Store, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';

export type PortalLink = {
  role: string;
  to: string;
  pathPrefix: string;
  label: string;
  icon: LucideIcon;
  accent: string;
};

export const portalLinks: PortalLink[] = [
  { role: 'admin', to: ROUTES.ADMIN_DASHBOARD, pathPrefix: '/admin', label: 'Admin Portal', icon: Shield, accent: 'text-slate-600' },
  { role: 'seller', to: ROUTES.SELLER_DASHBOARD, pathPrefix: '/seller', label: 'Seller Center', icon: Store, accent: 'text-amber-700' },
  { role: 'shipper', to: ROUTES.SHIPPER_DASHBOARD, pathPrefix: '/shipper', label: 'Shipper Portal', icon: Truck, accent: 'text-emerald-700' },
];

export function getVisiblePortals(role?: string): PortalLink[] {
  if (!role || role === 'customer') return [];
  return role === 'admin'
    ? portalLinks.filter((p) => p.role === 'admin' || p.role === 'seller')
    : portalLinks.filter((p) => p.role === role);
}
