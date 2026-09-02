import { HomeNavbar } from '@/components/home/home-navbar';
import { HomeFooter } from '@/components/home/home-footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function EventDetailLoading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between">
      <HomeNavbar />

      <main className="flex-1">
        <article className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-6">
            <Skeleton className="h-5 w-32 rounded-lg" />

            <div className="flex items-center gap-2 pt-4">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-28 rounded-full" />
            </div>

            <Skeleton className="h-10 sm:h-14 w-full rounded-2xl" />

            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-36 rounded" />
            </div>

            <Skeleton className="aspect-[16/9] w-full rounded-3xl" />

            {/* Content paragraph skeletons */}
            <div className="space-y-4 pt-6">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </div>
          </div>
        </article>
      </main>

      <HomeFooter />
    </div>
  );
}
