import { Skeleton } from '@/components/ui/skeleton';

export default function AccountSupportLoading() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7 space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
