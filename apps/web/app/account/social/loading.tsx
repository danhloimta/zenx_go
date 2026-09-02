import { Skeleton } from '@/components/ui/skeleton';

export default function SocialLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="space-y-1.5">
        <Skeleton className="h-6 w-44 rounded-lg" />
        <Skeleton className="h-3.5 w-64 rounded" />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-3 w-36 rounded" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
