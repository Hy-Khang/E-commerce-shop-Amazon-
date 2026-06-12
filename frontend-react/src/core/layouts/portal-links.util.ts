import { Shield, Store, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { PERMISSIONS } from '@/common/constants/permissions';

export type PortalLink = {
  role: string;
  permission: string;
  to: string;
  pathPrefix: string;
  label: string;
  icon: LucideIcon;
  accent: string;
};

export const portalLinks: PortalLink[] = [
  { role: 'admin', permission: PERMISSIONS.PORTAL_ADMIN, to: ROUTES.ADMIN_DASHBOARD, pathPrefix: '/admin', label: 'Admin Portal', icon: Shield, accent: 'text-slate-600' },
  { role: 'seller', permission: PERMISSIONS.PORTAL_SELLER, to: ROUTES.SELLER_DASHBOARD, pathPrefix: '/seller', label: 'Seller Center', icon: Store, accent: 'text-amber-700' },
  { role: 'shipper', permission: PERMISSIONS.PORTAL_SHIPPER, to: ROUTES.SHIPPER_DASHBOARD, pathPrefix: '/shipper', label: 'Shipper Portal', icon: Truck, accent: 'text-emerald-700' },
];

export function getVisiblePortals(hasPermission: (p: string) => boolean): PortalLink[] {
  return portalLinks.filter((p) => hasPermission(p.permission));
}
