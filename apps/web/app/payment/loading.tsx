import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentLoading() {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      {/* Top Banner: Wallet Balance Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20 rounded" />
              <div className="flex items-baseline gap-2">
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>
          </div>
          <Skeleton className="hidden h-20 w-28 rounded-xl sm:block" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Packages & Payment Methods */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-8">
          {/* Section 1: Packages */}
          <div>
            <Skeleton className="h-5 w-36 rounded" />
            <div className="mt-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4 space-y-2 flex flex-col items-center">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Section 2: Payment Methods */}
          <div>
            <Skeleton className="h-5 w-52 rounded" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3.5 flex items-center gap-3.5">
                  <Skeleton className="size-8 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary Sticky Card */}
        <aside className="h-fit">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
            <Skeleton className="h-5 w-44 rounded" />
            <div className="space-y-3 pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3.5 w-20 rounded" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-3.5 w-24 rounded" />
              </div>
              <div className="h-px bg-slate-100 my-2" />
              <div className="rounded-xl bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-6 w-28 rounded" />
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
