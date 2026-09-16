import { Skeleton } from '@/components/ui/skeleton';

export default function GameAuditLoading() {
  return (
    <div className="space-y-4 sm:space-y-5 pb-12 w-full relative">
      {/* Top Progress Line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-emerald-100 overflow-hidden">
        <div className="h-full w-2/5 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#00873E] animate-[pulse_1s_ease-in-out_infinite] rounded-full" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-6 w-56 rounded" />
          </div>
          <Skeleton className="h-3.5 w-80 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((v) => (
          <div key={v} className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Table Card Skeleton */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-72 rounded-lg" />
        </div>
        <div className="divide-y divide-slate-100 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((v) => (
            <div key={v} className="flex items-center gap-4 pt-4 first:pt-0">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-28 shrink-0" />
              <Skeleton className="h-4 w-28 shrink-0" />
              <Skeleton className="h-4 w-32 shrink-0" />
              <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
