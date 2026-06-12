import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, MessageSquare, Package, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore, useLogout } from '@/features/auth';
import { ROUTES } from '@/common/constants/routes';
import { getVisiblePortals } from './portal-links.util';

export function UserDropdown() {
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
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
          {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <span className="hidden max-w-[100px] truncate text-sm font-medium lg:inline">{user?.full_name || 'Profile'}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-neutral-200/80 bg-white py-1 shadow-lg shadow-neutral-900/5">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-medium text-neutral-900">{user?.full_name}</p>
            <p className="text-xs text-neutral-500">{user?.email}</p>
          </div>

          <div className="py-1">
            <DropdownLink to={ROUTES.PROFILE} icon={<User className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              My Profile
            </DropdownLink>
            <DropdownLink to={ROUTES.ORDERS} icon={<Package className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              Orders
            </DropdownLink>
            <DropdownLink to={ROUTES.ADDRESSES} icon={<MapPin className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              Addresses
            </DropdownLink>
            <DropdownLink to={ROUTES.MY_REVIEWS} icon={<MessageSquare className="h-4 w-4" />} onClick={() => setIsOpen(false)}>
              My Reviews
            </DropdownLink>
          </div>

          <PortalSection role={user?.role} onClose={() => setIsOpen(false)} />

          <div className="border-t border-neutral-100 py-1">
            <button
              onClick={() => { logout(); setIsOpen(false); }}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-error-500 hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
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
      className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

function PortalSection({ role, onClose }: { role?: string; onClose: () => void }) {
  const visible = getVisiblePortals(role);
  if (visible.length === 0) return null;

  return (
    <div className="border-t border-neutral-100 py-1">
      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        Manage
      </p>
      {visible.map((portal) => {
        const Icon = portal.icon;
        return (
          <Link
            key={portal.role}
            to={portal.to}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-neutral-50 transition-colors ${portal.accent}`}
          >
            <Icon className="h-4 w-4" />
            {portal.label}
          </Link>
        );
      })}
    </div>
  );
}
