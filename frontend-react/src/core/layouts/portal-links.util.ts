import { Shield, Store, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ROUTES } from '@/common/constants/routes';
import { PERMISSIONS } from '@/common/constants/permissions';

export type PortalLink = {
  role: string;
  permission: string;
  to: string;
  pathPrefix: string;
  /** i18n key in the `nav` namespace (e.g. 'portals.adminPortal'). */
  labelKey: string;
  icon: LucideIcon;
  accent: string;
};

export const portalLinks: PortalLink[] = [
  { role: 'admin', permission: PERMISSIONS.PORTAL_ADMIN, to: ROUTES.ADMIN_DASHBOARD, pathPrefix: '/admin', labelKey: 'portals.adminPortal', icon: Shield, accent: 'text-slate-600 dark:text-slate-300' },
  { role: 'seller', permission: PERMISSIONS.PORTAL_SELLER, to: ROUTES.SELLER_DASHBOARD, pathPrefix: '/seller', labelKey: 'portals.sellerCenter', icon: Store, accent: 'text-amber-700 dark:text-amber-400' },
  { role: 'shipper', permission: PERMISSIONS.PORTAL_SHIPPER, to: ROUTES.SHIPPER_DASHBOARD, pathPrefix: '/shipper', labelKey: 'portals.shipperPortal', icon: Truck, accent: 'text-emerald-700 dark:text-emerald-400' },
];

export function getVisiblePortals(hasPermission: (p: string) => boolean): PortalLink[] {
  return portalLinks.filter((p) => hasPermission(p.permission));
}
