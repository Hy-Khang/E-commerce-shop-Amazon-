import type { ReactNode } from 'react';

interface Props {
  label: string;
  children: ReactNode;
}

/** A labeled dashboard module group (admin design language). */
export function DashboardSection({ label, children }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </h2>
      {children}
    </section>
  );
}
