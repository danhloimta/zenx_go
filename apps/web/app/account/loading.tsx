import { StatsCardsSkeleton, TransactionsListSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountOverviewLoading() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-10">
      {/* 1. Welcome Hero Banner Skeleton */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <Skeleton className="size-16 sm:size-20 rounded-full shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-44 rounded" />
              <Skeleton className="h-3.5 w-36 rounded" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 2. Key Stats Overview Cards Skeleton */}
      <StatsCardsSkeleton count={3} />

      {/* 3. Quick Actions Grid Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <Skeleton className="h-5 w-44 rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Transactions Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-3.5 w-48 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <TransactionsListSkeleton count={4} />
      </div>
    </div>
  );
}
