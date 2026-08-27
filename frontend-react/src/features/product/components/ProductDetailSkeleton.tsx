export function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square rounded-xl bg-neutral-200 dark:bg-neutral-700" />
        <div className="space-y-4">
          <div className="h-8 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-6 w-1/4 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-5/6 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-4 w-2/3 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-10 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-10 w-20 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="h-12 w-40 rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}
