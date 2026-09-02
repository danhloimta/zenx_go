import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-9 w-36 rounded-xl" />
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-7 w-48 rounded-xl" />
          <Skeleton className="h-4 w-60 rounded" />
        </div>

        <div className="rounded-2xl bg-slate-50 p-5 text-center space-y-2">
          <Skeleton className="h-3.5 w-16 mx-auto rounded" />
          <Skeleton className="h-8 w-44 mx-auto rounded-xl" />
          <Skeleton className="h-4 w-28 mx-auto rounded" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-5 w-32 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
