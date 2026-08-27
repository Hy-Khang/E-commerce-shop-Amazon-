import { type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaginationMeta } from '@/core/api/api.types';
import { getPageRange } from '@/common/utils/pagination.util';

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 50, 100];

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
};

type AdminDataTableProps<T> = {
  columns: Column<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  meta?: PaginationMeta;
  onPageChange?: (page: number) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  toolbar?: ReactNode;
  skeletonRows?: number;
  /** Page-size options for the footer selector. Pass `[]` to hide it. */
  pageSizeOptions?: number[];
};

export function AdminDataTable<T>({
  columns,
  data,
  isLoading = false,
  meta,
  onPageChange,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your filters or check back later.',
  toolbar,
  skeletonRows = 5,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: AdminDataTableProps<T>) {
  return (
    <div className="space-y-4">
      {toolbar}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="admin-table-header">
                {columns.map((col) => (
                  <th key={col.key} className={`px-6 py-3.5 ${col.className ?? ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading
                ? Array.from({ length: skeletonRows }, (_, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data && data.length > 0
                  ? data.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/50"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-6 py-4 text-sm text-slate-700 dark:text-slate-300 ${col.className ?? ''}`}
                          >
                            {col.render(row, i)}
                          </td>
                        ))}
                      </tr>
                    ))
                  : null}
            </tbody>
          </table>
        </div>

        {!isLoading && (!data || data.length === 0) && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <EmptyIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{emptyDescription}</p>
          </div>
        )}

        {meta && meta.total > 0 && (
          <Pagination
            meta={meta}
            onPageChange={onPageChange}
            pageSizeOptions={pageSizeOptions}
          />
        )}
      </div>
    </div>
  );
}

function Pagination({
  meta,
  onPageChange,
  pageSizeOptions,
}: {
  meta: PaginationMeta;
  onPageChange?: (page: number) => void;
  pageSizeOptions: number[];
}) {
  const [, setSearchParams] = useSearchParams();
  const pages = getPageRange(meta.page, meta.totalPages);
  const showPageSize = pageSizeOptions.length > 0;
  const showPageNav = meta.totalPages > 1 && onPageChange;

  // Keep the current limit selectable even if it isn't one of the presets.
  const sizeOptions = pageSizeOptions.includes(meta.limit)
    ? pageSizeOptions
    : [...pageSizeOptions, meta.limit].sort((a, b) => a - b);

  function handleLimitChange(nextLimit: number) {
    setSearchParams((prev) => {
      prev.set('limit', String(nextLimit));
      prev.set('page', '1');
      return prev;
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing{' '}
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {(meta.page - 1) * meta.limit + 1}
          </span>
          –
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {Math.min(meta.page * meta.limit, meta.total)}
          </span>{' '}
          of <span className="font-medium text-slate-700 dark:text-slate-300">{meta.total}</span>
        </p>

        {showPageSize && (
          <label className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={meta.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-7 text-sm text-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              aria-label="Rows per page"
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {showPageNav && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(meta.page - 1)}
            disabled={meta.page <= 1}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-sm text-slate-400 dark:text-slate-500">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                  p === meta.page
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
