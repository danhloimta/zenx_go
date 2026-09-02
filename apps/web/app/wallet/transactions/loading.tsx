import { Skeleton } from '@/components/ui/skeleton';

export default function WalletTransactionsLoading() {
  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
      </div>

      {/* Filter Card Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>

      {/* Transactions List Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-4 w-28 rounded ml-auto" />
                <Skeleton className="h-5 w-20 rounded-md ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
