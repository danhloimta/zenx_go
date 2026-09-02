import { Skeleton } from '@/components/ui/skeleton';

export default function SecurityLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-3.5 w-64 rounded" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <Skeleton className="h-5 w-44 rounded-lg" />

        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-5 rounded" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-3.5 w-36 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36 rounded" />
          <Skeleton className="h-3 w-64 rounded" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
      </div>
    </div>
  );
}
