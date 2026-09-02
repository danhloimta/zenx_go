import { Skeleton } from '@/components/ui/skeleton';

export default function ChangePasswordLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <Skeleton className="h-9 w-28 rounded-xl" />

      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-44 rounded-lg" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>
    </div>
  );
}
