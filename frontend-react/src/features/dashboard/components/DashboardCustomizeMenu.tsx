import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import {
  DASHBOARD_SECTIONS,
  type DashboardSectionKey,
  type SectionVisibility,
} from '../hooks/useDashboardSections';

interface Props {
  visible: SectionVisibility;
  onToggle: (key: DashboardSectionKey) => void;
}

/** ⚙ dropdown to show/hide whole dashboard sections (state persisted by hook). */
export function DashboardCustomizeMenu({ visible, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Customize
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-lg border border-slate-200 bg-white py-2 shadow-lg ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Sections
          </p>
          {DASHBOARD_SECTIONS.map((section) => {
            const isVisible = visible[section.key];
            return (
              <button
                key={section.key}
                type="button"
                role="menuitemcheckbox"
                aria-checked={isVisible}
                onClick={() => onToggle(section.key)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {section.label}
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    isVisible
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                  }`}
                >
                  {isVisible && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
