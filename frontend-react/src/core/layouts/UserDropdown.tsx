import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, MapPin, MessageSquare, Package, Store, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore, useLogout } from '@/features/auth';
import { ROUTES } from '@/common/constants/routes';
import { PERMISSIONS } from '@/common/constants/permissions';
import { getVisiblePortals } from './portal-links.util';

export function UserDropdown() {
  const { t } = useTranslation('nav');
  const user = useAuthStore((s) => s.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-text-secondary hover:bg-surface-hover transition-colors"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-xs font-bold text-text-brand">
          {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <span className="hidden max-w-[100px] truncate text-sm font-medium lg:inline">{user?.full_name || t('header.profileFallback')}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border-default bg-elevated py-1 shadow-lg shadow-neutral-900/5">
          <div className="border-b border-border-default px-4 py-3">
            <p className="text-sm font-medium text-text-primary">{user?.full_name}</p>
            <p className="text-xs text-text-secondary">{user?.email}</p>
          </div>

          <div className="py-1">
            <DropdownLink to={ROUTES.PROFILE} icon={<User className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              {t('account.myProfile')}
            </DropdownLink>
            <DropdownLink to={ROUTES.ORDERS} icon={<Package className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              {t('account.orders')}
            </DropdownLink>
            <DropdownLink to={ROUTES.ADDRESSES} icon={<MapPin className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              {t('account.addresses')}
            </DropdownLink>
            <DropdownLink to={ROUTES.MY_REVIEWS} icon={<MessageSquare className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              {t('account.myReviews')}
            </DropdownLink>
          </div>

          <BecomeSellerLink onClose={() => setIsOpen(false)} />

          <PortalSection onClose={() => setIsOpen(false)} />

          <div className="border-t border-border-default py-1">
            <button
              onClick={() => { logout(); setIsOpen(false); }}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-500 hover:bg-surface-hover disabled:opacity-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? t('account.loggingOut') : t('account.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({ to, icon, onClick, children }: { to: string; icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

/** Shown only to logged-in users who are not yet sellers (no seller portal). */
function BecomeSellerLink({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('nav');
  const hasPermission = useAuthStore((s) => s.hasPermission);
  if (hasPermission(PERMISSIONS.PORTAL_SELLER)) return null;

  return (
    <div className="border-t border-border-default py-1">
      <Link
        to={ROUTES.BECOME_SELLER}
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-text-brand hover:bg-surface-hover transition-colors"
      >
        <Store className="h-4 w-4" />
        {t('account.becomeSeller')}
      </Link>
    </div>
  );
}

function PortalSection({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('nav');
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const visible = getVisiblePortals(hasPermission);
  if (visible.length === 0) return null;

  return (
    <div className="border-t border-border-default py-1">
      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
        {t('sections.manage')}
      </p>
      {visible.map((portal) => {
        const Icon = portal.icon;
        return (
          <Link
            key={portal.role}
            to={portal.to}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-hover transition-colors ${portal.accent}`}
          >
            <Icon className="h-4 w-4" />
            {t(portal.labelKey, { defaultValue: portal.labelKey })}
          </Link>
        );
      })}
    </div>
  );
}
