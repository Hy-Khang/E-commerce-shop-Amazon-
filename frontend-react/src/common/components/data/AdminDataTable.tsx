import { type ReactNode } from 'react';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PaginationMeta } from '@/core/api/api.types';
import { getPageRange } from '@/common/utils/pagination.util';

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
            <tbody className="divide-y divide-slate-100">
              {isLoading
                ? Array.from({ length: skeletonRows }, (_, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data && data.length > 0
                  ? data.map((row, i) => (
                      <tr
                        key={i}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className={`px-6 py-4 text-sm text-slate-700 ${col.className ?? ''}`}
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
            <EmptyIcon className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-900">{emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
          </div>
        )}

        {meta && meta.totalPages > 1 && onPageChange && (
          <Pagination meta={meta} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}

function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const pages = getPageRange(meta.page, meta.totalPages);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5">
      <p className="text-sm text-slate-500">
        Showing{' '}
        <span className="font-medium text-slate-700">
          {(meta.page - 1) * meta.limit + 1}
        </span>
        –
        <span className="font-medium text-slate-700">
          {Math.min(meta.page * meta.limit, meta.total)}
        </span>{' '}
        of <span className="font-medium text-slate-700">{meta.total}</span>
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(meta.page - 1)}
          disabled={meta.page <= 1}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                p === meta.page
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
