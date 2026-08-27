export function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-xl border border-border-default bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-700" />
              <div className="h-3 w-36 rounded bg-neutral-200 dark:bg-neutral-700" />
            </div>
            <div className="h-5 w-20 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          </div>

          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="ml-auto h-3 w-8 rounded bg-neutral-200 dark:bg-neutral-700" />
                  <div className="ml-auto h-3.5 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border-default pt-3">
            <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
