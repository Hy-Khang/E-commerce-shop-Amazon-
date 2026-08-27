import { Shield, Store, Truck, User } from 'lucide-react';
import type { UserRoleCount } from '../types/dashboard.types';

interface Props {
  roles: UserRoleCount[];
}

const roleConfig: Record<string, { icon: typeof Shield; bg: string; text: string; label: string }> = {
  admin: { icon: Shield, bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', label: 'Admin' },
  seller: { icon: Store, bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', label: 'Seller' },
  shipper: { icon: Truck, bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', label: 'Shipper' },
  customer: { icon: User, bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: 'Customer' },
};

export function UserRoleBreakdown({ roles }: Props) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
      <h2 className="mb-3 font-jakarta text-lg font-bold text-slate-900 dark:text-slate-100">
        Users by Role
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((role) => {
          const config = roleConfig[role.role];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div
              key={role.role}
              className={`flex items-center gap-3 rounded-lg ${config.bg} px-3 py-2.5`}
            >
              <Icon className={`h-4 w-4 ${config.text}`} />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{config.label}</p>
                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {role.count}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
