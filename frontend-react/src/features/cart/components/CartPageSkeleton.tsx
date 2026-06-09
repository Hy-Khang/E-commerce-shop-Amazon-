export function CartPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 h-8 w-48 rounded bg-neutral-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border-default bg-white p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border-default py-4 last:border-b-0">
                <div className="h-20 w-20 rounded-lg bg-neutral-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 rounded bg-neutral-200" />
                  <div className="h-4 w-24 rounded bg-neutral-200" />
                </div>
                <div className="h-8 w-24 rounded bg-neutral-200" />
                <div className="h-4 w-20 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="rounded-xl border border-border-default bg-white p-6">
            <div className="h-6 w-36 rounded bg-neutral-200" />
            <div className="mt-4 space-y-3">
              <div className="h-4 w-full rounded bg-neutral-200" />
              <div className="h-4 w-full rounded bg-neutral-200" />
            </div>
            <div className="mt-4 border-t border-border-default pt-4">
              <div className="h-5 w-full rounded bg-neutral-200" />
            </div>
            <div className="mt-6 h-12 w-full rounded bg-neutral-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
