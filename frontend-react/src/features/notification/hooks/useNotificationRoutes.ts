import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/common/constants/routes';

export type NotificationContext = 'customer' | 'admin' | 'seller' | 'shipper';

export function useNotificationRoutes() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) {
    return {
      context: 'admin' as NotificationContext,
      orderDetailPath: ROUTES.ADMIN_ORDER_DETAIL,
      notificationsPath: ROUTES.ADMIN_NOTIFICATIONS,
    };
  }

  if (pathname.startsWith('/seller')) {
    return {
      context: 'seller' as NotificationContext,
      orderDetailPath: ROUTES.SELLER_ORDER_DETAIL,
      notificationsPath: ROUTES.SELLER_NOTIFICATIONS,
    };
  }

  if (pathname.startsWith('/shipper')) {
    return {
      context: 'shipper' as NotificationContext,
      orderDetailPath: () => ROUTES.SHIPPER_DELIVERIES,
      notificationsPath: ROUTES.SHIPPER_NOTIFICATIONS,
    };
  }

  return {
    context: 'customer' as NotificationContext,
    orderDetailPath: ROUTES.ORDER_DETAIL,
    notificationsPath: ROUTES.NOTIFICATIONS,
  };
}
