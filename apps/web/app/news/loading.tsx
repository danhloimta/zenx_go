import {
  PortalSkeletonLayout,
  PortalBannerSkeleton,
  FilterTabsSkeleton,
  FilterPillsSkeleton,
  ArticleGridSkeleton,
  PaginationSkeleton,
} from '@/components/skeletons';

export default function NewsLoading() {
  return (
    <PortalSkeletonLayout>
      <PortalBannerSkeleton badgeWidth="w-48" titleWidth="w-3/4 max-w-md" />
      <div className="space-y-4">
        <FilterTabsSkeleton count={5} />
        <FilterPillsSkeleton count={5} />
      </div>
      <ArticleGridSkeleton count={5} hasFeatured />
      <PaginationSkeleton />
    </PortalSkeletonLayout>
  );
}
