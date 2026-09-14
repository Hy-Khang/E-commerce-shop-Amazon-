import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

type Accent = 'none' | 'brand' | 'flash';

interface Props {
  /** Section heading (unified `font-display` scale across every home rail). */
  title: string;
  /**
   * Lucide icon element. For `accent='brand'` it is placed in a filled brand
   * badge (the personalized "signature" look); otherwise it renders bare, so
   * pass it pre-colored (e.g. `<Trophy className="h-5 w-5 text-amber-500" />`).
   */
  icon?: ReactNode;
  /**
   * Supporting line under the title — a brand pill when `accent='brand'`
   * (e.g. the recommendation reason), muted text otherwise. Falsy → omitted.
   */
  subtitle?: ReactNode;
  /** Inline slot next to the title (e.g. the Flash Sale countdown). */
  headerExtra?: ReactNode;
  /** Renders a right-aligned "View all" link when provided. */
  viewAllHref?: string;
  /**
   * Panel tint. `none` = the calm white `shop-card` shell (default); `brand`
   * (green) and `flash` (rose) are the two intentional accents
   * (Recommended / Flash Sale).
   */
  accent?: Accent;
  /** The rail body — a card grid or a horizontal-scroll carousel. */
  children: ReactNode;
}

const PANEL: Record<Accent, string> = {
  none: 'shop-card p-6',
  brand:
    'rounded-xl border border-border-brand/25 bg-gradient-to-br from-brand-light via-surface to-surface p-6 shadow-sm',
  flash:
    'rounded-2xl bg-gradient-to-r from-orange-100 via-amber-100/70 to-orange-100 ring-1 ring-inset ring-orange-200/60 p-6 dark:from-orange-500/[0.1] dark:via-amber-500/[0.06] dark:to-orange-500/[0.1] dark:ring-orange-500/12',
};

const VIEW_ALL: Record<Accent, string> = {
  none: 'text-text-brand hover:text-primary-700',
  brand: 'text-text-brand hover:text-primary-700',
  flash:
    'text-orange-700 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300',
};

/**
 * Shared shell for every home-page rail — one panel + header system so the page
 * reads as a consistent stack. Only the `accent` tint varies; the two accents
 * (brand / amber) are the sole colored panels, standing out against the calm
 * white default. Callers supply the rail body (grid or carousel) as children.
 */
export function SectionPanel({
  title,
  icon,
  subtitle,
  headerExtra,
  viewAllHref,
  accent = 'none',
  children,
}: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className={PANEL[accent]}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon &&
            (accent === 'brand' ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-text-inverse shadow-sm">
                {icon}
              </span>
            ) : (
              <span className="flex h-8 items-center">{icon}</span>
            ))}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                {title}
              </h2>
              {headerExtra}
            </div>
            {subtitle &&
              (accent === 'brand' ? (
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-text-brand">
                  {subtitle}
                </span>
              ) : (
                <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
              ))}
          </div>
        </div>

        {viewAllHref && (
          <Link
            to={viewAllHref}
            className={`shrink-0 self-center text-sm font-semibold transition-colors ${VIEW_ALL[accent]}`}
          >
            View all
          </Link>
        )}
      </div>

      {children}
    </motion.section>
  );
}
