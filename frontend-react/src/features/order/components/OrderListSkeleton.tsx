export function OrderListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
