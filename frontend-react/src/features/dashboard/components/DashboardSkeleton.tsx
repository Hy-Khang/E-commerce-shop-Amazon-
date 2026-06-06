function Pulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Pulse className="h-9 w-48" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Pulse key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Pulse className="h-80 rounded-xl" />
        <Pulse className="h-80 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Pulse className="h-72 rounded-xl" />
        <div className="space-y-6">
          <Pulse className="h-44 rounded-xl" />
          <Pulse className="h-64 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
