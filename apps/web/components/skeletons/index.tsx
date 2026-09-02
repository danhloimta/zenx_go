import { HomeNavbar } from '@/components/home/home-navbar';
import { HomeFooter } from '@/components/home/home-footer';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Common Layout Skeleton cho các trang Portal (Games, News, Events, Rewards, Community, Support)
 */
export function PortalSkeletonLayout({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between">
      <HomeNavbar />
      <main className="flex-1">
        <div className={`min-h-screen bg-[#f8fafc] px-4 py-10 sm:px-6 lg:px-8 sm:py-14 ${className}`}>
          <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12">{children}</div>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}

/**
 * Common Hero Header Banner Skeleton cho các trang Portal
 */
export function PortalBannerSkeleton({
  hasSearch = false,
  hasActions = false,
  badgeWidth = 'w-44',
  titleWidth = 'w-3/4 max-w-md',
}: {
  hasSearch?: boolean;
  hasActions?: boolean;
  badgeWidth?: string;
  titleWidth?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/40 to-sky-50/50 p-8 sm:p-12 lg:p-14 shadow-sm space-y-4">
      <Skeleton className={`h-6 ${badgeWidth} rounded-full`} />
      <Skeleton className={`h-10 sm:h-14 ${titleWidth} rounded-2xl`} />
      <Skeleton className="h-4 w-full max-w-xl rounded" />
      <Skeleton className="h-4 w-4/5 max-w-lg rounded" />

      {hasSearch && (
        <div className="pt-4 max-w-md">
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      )}

      {hasActions && (
        <div className="mt-8 flex flex-wrap items-center gap-3.5 pt-2">
          <Skeleton className="h-11 w-44 rounded-xl" />
          <Skeleton className="h-11 w-52 rounded-xl" />
        </div>
      )}
    </div>
  );
}

/**
 * Common Filter Tabs Skeleton (ngang, có scroll)
 */
export function FilterTabsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center overflow-x-auto pb-2 gap-2.5 sm:gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-32 sm:w-36 rounded-xl shrink-0" />
      ))}
    </div>
  );
}

/**
 * Common Secondary Filter Pills Skeleton (Lọc theo game / trạng thái)
 */
export function FilterPillsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-6">
      <Skeleton className="h-4 w-24 rounded mr-1" />
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-28 sm:w-32 rounded-xl" />
      ))}
    </div>
  );
}

/**
 * Common Pagination Skeleton
 */
export function PaginationSkeleton() {
  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      <Skeleton className="h-10 w-28 rounded-xl" />
      <Skeleton className="h-10 w-28 rounded-xl" />
      <Skeleton className="h-10 w-28 rounded-xl" />
    </div>
  );
}

/**
 * Common Game Card Grid Skeleton
 */
export function GameGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md p-3 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <Skeleton className="aspect-[3/4.2] w-full rounded-2xl bg-slate-900" />
            <div className="px-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20 rounded bg-slate-800" />
                <Skeleton className="h-4 w-16 rounded bg-slate-800" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded bg-slate-800" />
              <Skeleton className="h-3.5 w-full rounded bg-slate-800" />
            </div>
          </div>
          <div className="pt-4 mt-3 border-t border-slate-900 flex items-center justify-between px-1">
            <Skeleton className="h-4 w-20 rounded bg-slate-800" />
            <Skeleton className="h-4 w-16 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Common Article Card Grid Skeleton
 */
export function ArticleGridSkeleton({ count = 5, hasFeatured = true }: { count?: number; hasFeatured?: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {hasFeatured && (
        <div className="md:col-span-2 lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <Skeleton className="aspect-[16/8] w-full rounded-2xl" />
            <div className="p-2 pt-4 space-y-3">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-7 w-4/5 rounded-xl" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        </div>
      )}

      {Array.from({ length: hasFeatured ? count - 1 : count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div>
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <div className="p-2 pt-4 space-y-2.5">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-6 w-5/6 rounded-lg" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Common Event Card Grid Skeleton
 */
export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between"
        >
          <div>
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <div className="p-2 pt-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-4/5 rounded-lg" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Common Transactions List Skeleton (dùng trong Wallet & Account)
 */
export function TransactionsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 sm:size-10 rounded-full shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 sm:w-44 rounded" />
              <Skeleton className="h-3 w-24 sm:w-28 rounded" />
            </div>
          </div>
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-4 w-20 sm:w-24 rounded ml-auto" />
            <Skeleton className="h-4 sm:h-5 w-14 sm:w-16 rounded-md ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Common Stats Cards 3 Columns Skeleton (dùng trong Account & Dashboard)
 */
export function StatsCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid gap-5 sm:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-7 w-36 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded" />
            </div>
            <Skeleton className="size-11 rounded-xl shrink-0" />
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
