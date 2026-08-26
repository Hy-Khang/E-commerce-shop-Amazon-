export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border-default bg-elevated">
      <div className="aspect-square bg-neutral-200 dark:bg-neutral-700" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    </div>
  );
}
