import { ServiceCardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container py-10">
      <div className="mb-8 flex flex-col gap-3">
        <div className="h-8 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
