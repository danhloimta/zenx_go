import { HomeNavbar } from '@/components/home/home-navbar';
import { HomeFooter } from '@/components/home/home-footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-[#00873E]/20">
      {/* Top Announcement Ribbon Skeleton */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-5 w-24 rounded-full bg-slate-800" />
            <Skeleton className="h-4 w-48 sm:w-80 rounded bg-slate-800" />
          </div>
          <Skeleton className="h-4 w-28 rounded bg-slate-800 hidden md:block" />
        </div>
      </div>

      {/* Top Header Navigation */}
      <HomeNavbar />

      <main className="flex-1 flex flex-col space-y-6 sm:space-y-10">
        {/* Section 1: Hero Showcase Skeleton */}
        <div className="w-full bg-[#050b14] pt-3 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 min-h-[460px] sm:min-h-[540px] lg:min-h-[580px] p-6 sm:p-10 lg:p-14 flex flex-col justify-end">
              <div className="max-w-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-28 rounded-lg bg-slate-800" />
                  <Skeleton className="h-6 w-36 rounded-lg bg-slate-800" />
                </div>
                <Skeleton className="h-10 sm:h-14 w-3/4 rounded-2xl bg-slate-800" />
                <Skeleton className="h-5 w-full max-w-lg rounded-lg bg-slate-800" />
                <Skeleton className="h-5 w-4/5 max-w-md rounded-lg bg-slate-800" />
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Skeleton className="h-12 w-36 rounded-xl bg-slate-800" />
                  <Skeleton className="h-12 w-32 rounded-xl bg-slate-800" />
                </div>
              </div>
              {/* Carousel Indicators Skeleton */}
              <div className="mt-8 flex items-center gap-2">
                <Skeleton className="h-2 w-8 rounded-full bg-emerald-500/50" />
                <Skeleton className="h-2 w-2 rounded-full bg-slate-800" />
                <Skeleton className="h-2 w-2 rounded-full bg-slate-800" />
                <Skeleton className="h-2 w-2 rounded-full bg-slate-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Quick Utility Strip Skeleton */}
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-xl" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-8">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Games Catalog Grid Skeleton */}
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-8 w-64 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs p-3 space-y-3">
                <Skeleton className="aspect-[3/4.2] w-full rounded-2xl" />
                <div className="p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-3.5 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: News & Updates Skeleton */}
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-8 w-60 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Featured Article Skeleton */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-6 w-5/6 rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
              </div>
            </div>

            {/* Side Articles Skeleton */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex gap-4 items-center">
                  <Skeleton className="size-20 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Ecosystem Section Skeleton */}
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm space-y-8">
            <div className="max-w-2xl space-y-3">
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-8 sm:h-10 w-4/5 rounded-xl" />
              <Skeleton className="h-4 w-full max-w-lg rounded" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-3">
                  <Skeleton className="size-12 rounded-xl" />
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-4/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 6: Pre-Footer CTA Skeleton */}
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <Skeleton className="h-8 sm:h-10 w-72 rounded-xl bg-slate-800" />
              <Skeleton className="h-4 w-full max-w-md rounded bg-slate-800" />
            </div>
            <Skeleton className="h-12 w-44 rounded-xl bg-slate-800 shrink-0" />
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <HomeFooter />
    </div>
  );
}
