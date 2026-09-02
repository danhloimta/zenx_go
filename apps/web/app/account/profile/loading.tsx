import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-10">
      {/* Top Banner Skeleton */}
      <Skeleton className="h-32 w-full rounded-3xl" />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Left Form Card Skeleton */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <Skeleton className="h-6 w-44 rounded-lg" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          </div>

          <Skeleton className="h-11 w-36 rounded-xl" />
        </div>

        {/* Right Info Card Skeleton */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
