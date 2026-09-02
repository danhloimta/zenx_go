import { TransactionsListSkeleton } from '@/components/skeletons';
import { Skeleton } from '@/components/ui/skeleton';

export default function WalletLoading() {
  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Wallet Balance Card Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
          <Skeleton className="size-14 rounded-2xl" />
        </div>
      </div>

      {/* Recent Transactions Card Skeleton */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-52 rounded" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>

        <TransactionsListSkeleton count={5} />
      </div>
    </div>
  );
}
