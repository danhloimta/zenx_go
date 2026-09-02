import { PortalSkeletonLayout, PortalBannerSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function RewardsLoading() {
  return (
    <PortalSkeletonLayout>
      {/* Hero Header Banner */}
      <PortalBannerSkeleton hasActions badgeWidth="w-52" titleWidth="w-3/4 max-w-lg" />

      {/* Benefits 3 Columns */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-8 w-64 rounded-xl" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <Skeleton className="size-14 rounded-2xl" />
                <Skeleton className="h-6 w-4/5 rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VIP Tiers 4 Columns */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-8 w-72 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-60 rounded" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24 rounded-xl" />
                  {index === 3 && <Skeleton className="h-5 w-20 rounded-full" />}
                </div>
                <Skeleton className="h-4 w-36 rounded" />
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-5/6 rounded" />
                  <Skeleton className="h-3.5 w-4/5 rounded" />
                  <Skeleton className="h-3.5 w-full rounded" />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Box */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl w-full space-y-3">
          <Skeleton className="h-4 w-44 rounded" />
          <Skeleton className="h-7 w-60 rounded-xl" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-4/5 rounded" />
        </div>
        <Skeleton className="h-11 w-44 rounded-xl shrink-0" />
      </section>
    </PortalSkeletonLayout>
  );
}
