import {
  PortalSkeletonLayout,
  PortalBannerSkeleton,
  FilterTabsSkeleton,
  FilterPillsSkeleton,
  GameGridSkeleton,
} from '@/components/skeletons';

export default function GamesLoading() {
  return (
    <PortalSkeletonLayout>
      <PortalBannerSkeleton hasSearch badgeWidth="w-44" titleWidth="w-3/4 max-w-md" />
      <div className="space-y-4">
        <FilterTabsSkeleton count={5} />
        <FilterPillsSkeleton count={4} />
      </div>
      <GameGridSkeleton count={8} />
    </PortalSkeletonLayout>
  );
}
