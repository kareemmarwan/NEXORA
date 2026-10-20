export default function Loading() {
  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-8 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-card"
          >
            <div className="h-40 w-full animate-pulse bg-muted" />
            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
