import {
  PortalSkeletonLayout,
  PortalBannerSkeleton,
  FilterTabsSkeleton,
  FilterPillsSkeleton,
  EventGridSkeleton,
  PaginationSkeleton,
} from '@/components/skeletons';

export default function EventsLoading() {
  return (
    <PortalSkeletonLayout>
      <PortalBannerSkeleton badgeWidth="w-48" titleWidth="w-3/4 max-w-md" />
      <div className="space-y-4">
        <FilterTabsSkeleton count={4} />
        <FilterPillsSkeleton count={5} />
      </div>
      <EventGridSkeleton count={6} />
      <PaginationSkeleton />
    </PortalSkeletonLayout>
  );
}
