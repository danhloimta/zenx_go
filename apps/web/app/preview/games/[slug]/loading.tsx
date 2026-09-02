import { Skeleton } from '@/components/ui/skeleton';

export default function GamePreviewLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden bg-slate-950 border-b border-slate-900 min-h-[560px] flex items-end p-6 sm:p-12 lg:p-16">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-full bg-slate-800" />
            <Skeleton className="h-6 w-28 rounded-full bg-slate-800" />
          </div>
          <Skeleton className="h-12 sm:h-16 w-4/5 rounded-2xl bg-slate-800" />
          <Skeleton className="h-5 w-full rounded bg-slate-800" />
          <div className="pt-4 flex flex-wrap gap-3">
            <Skeleton className="h-12 w-36 rounded-xl bg-slate-800" />
          </div>
        </div>
      </section>
    </div>
  );
}
