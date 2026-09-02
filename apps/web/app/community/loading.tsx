import { PortalSkeletonLayout, PortalBannerSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunityLoading() {
  return (
    <PortalSkeletonLayout>
      {/* Hero Header Banner */}
      <PortalBannerSkeleton badgeWidth="w-44" titleWidth="w-3/4 max-w-xl" />

      {/* Official Channels Grid */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-8 w-64 rounded-xl" />
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
                  <Skeleton className="h-5 w-28 rounded-lg" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="size-4 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Game Community Hubs */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-60 rounded-xl" />
          </div>
          <Skeleton className="h-4 w-64 rounded" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3.5">
                  <Skeleton className="size-12 rounded-2xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-3.5 w-1/2 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-4/5 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="size-3.5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Principles */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2 flex flex-col items-center">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-8 w-72 rounded-xl" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-3">
              <Skeleton className="size-12 rounded-xl" />
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
          ))}
        </div>
      </section>
    </PortalSkeletonLayout>
  );
}
