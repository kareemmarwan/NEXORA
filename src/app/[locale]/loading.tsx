import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container flex flex-col gap-8 py-12">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
