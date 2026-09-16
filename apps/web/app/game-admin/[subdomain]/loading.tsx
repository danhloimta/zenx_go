import { Skeleton } from '@/components/ui/skeleton';

export default function GameAdminDashboardLoading() {
  return (
    <div className="space-y-4 sm:space-y-4.5 pb-8 w-full relative">
      {/* Top Progress Line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100 overflow-hidden">
        <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00873E] animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7.5 w-24 rounded-lg" />
          <Skeleton className="h-7.5 w-36 rounded-lg" />
          <Skeleton className="h-7.5 w-28 rounded-lg" />
        </div>
      </div>

      {/* 4 KPI Cards Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((v) => (
          <div key={v} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-2.5 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Growth Strip Skeleton */}
      <Skeleton className="h-16 rounded-xl" />

      {/* Launchpad Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <Skeleton key={v} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Activity Columns Skeleton */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((v) => (
              <Skeleton key={v} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-3">
          <Skeleton className="h-5 w-36 rounded" />
          <div className="space-y-2.5 pt-2">
            {[1, 2, 3, 4].map((v) => (
              <Skeleton key={v} className="h-12 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
