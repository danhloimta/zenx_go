import { PortalSkeletonLayout, PortalBannerSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupportLoading() {
  return (
    <PortalSkeletonLayout>
      {/* Hero Search Section */}
      <PortalBannerSkeleton hasSearch badgeWidth="w-52" titleWidth="w-3/4 max-w-xl" />

      {/* Quick Contact 3 Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <Skeleton className="size-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-64 rounded-xl" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Skeleton className="h-9 w-20 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-24 rounded-xl shrink-0" />
            <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between"
            >
              <div className="space-y-2 flex-1 max-w-xl">
                <Skeleton className="h-5 w-4/5 rounded-lg" />
                <Skeleton className="h-3.5 w-24 rounded" />
              </div>
              <Skeleton className="size-5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </PortalSkeletonLayout>
  );
}
