import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, MessageSquare, Package, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore, useLogout } from '@/features/auth';
import { ROUTES } from '@/common/constants/routes';

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
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        {user?.full_name || 'Profile'}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
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

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => { logout(); setIsOpen(false); }}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
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
      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      {icon}
      {children}
    </Link>
  );
}
