import { RefreshCw } from 'lucide-react';

interface Props {
  title: string;
  onRetry?: () => void;
}

export function SectionError({ title, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 dark:border-slate-700 dark:bg-slate-800/30">
      <p className="text-sm text-slate-400 dark:text-slate-500">Failed to load {title}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
