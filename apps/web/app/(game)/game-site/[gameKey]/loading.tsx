import { Skeleton } from '@/components/ui/skeleton';

export default function GameSiteLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden bg-slate-950 border-b border-slate-900 min-h-[560px] flex items-end p-6 sm:p-12 lg:p-16">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-full bg-slate-800" />
            <Skeleton className="h-6 w-28 rounded-full bg-slate-800" />
          </div>
          <Skeleton className="h-12 sm:h-16 w-4/5 rounded-2xl bg-slate-800" />
          <Skeleton className="h-5 w-full rounded bg-slate-800" />
          <Skeleton className="h-5 w-3/4 rounded bg-slate-800" />
          <div className="pt-4 flex flex-wrap gap-3">
            <Skeleton className="h-12 w-36 rounded-xl bg-slate-800" />
            <Skeleton className="h-12 w-32 rounded-xl bg-slate-800" />
          </div>
        </div>
      </section>

      {/* Main Content Sections Skeleton */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-16 sm:px-6 lg:px-8">
        {/* About Section Skeleton */}
        <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-4">
            <Skeleton className="h-4 w-28 rounded bg-slate-800" />
            <Skeleton className="h-10 w-3/4 rounded-xl bg-slate-800" />
            <Skeleton className="h-4 w-full rounded bg-slate-800" />
            <Skeleton className="h-4 w-5/6 rounded bg-slate-800" />
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4">
            <Skeleton className="h-6 w-32 rounded-lg bg-slate-800" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded-full bg-slate-800" />
              <Skeleton className="h-8 w-20 rounded-full bg-slate-800" />
            </div>
            <Skeleton className="h-4 w-full rounded bg-slate-800" />
          </div>
        </section>

        {/* Feature Grid Skeleton */}
        <section className="space-y-6">
          <Skeleton className="h-8 w-60 rounded-xl bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-3">
                <Skeleton className="size-6 rounded-lg bg-slate-800" />
                <Skeleton className="h-5 w-32 rounded bg-slate-800" />
                <Skeleton className="h-3.5 w-full rounded bg-slate-800" />
                <Skeleton className="h-3.5 w-4/5 rounded bg-slate-800" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
