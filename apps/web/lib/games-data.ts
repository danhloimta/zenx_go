import type { GameArticleSummary, GameSummary } from '@zenx-go/api-client';
import { gameUrl } from './domain';

export interface GameFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface GameItem {
  id: string;
  slug: string;
  subdomain: string;
  websiteUrl: string;
  recordType: 'REAL' | 'DEMO';
  lifecycleStatus: 'IN_DEVELOPMENT' | 'INTERNAL_TEST' | 'CLOSED_BETA' | 'OPEN_BETA' | 'LIVE' | 'COMING_SOON' | 'CONCEPT' | 'SUNSET';
  operationalStatus: 'AVAILABLE' | 'MAINTENANCE' | 'DEGRADED' | 'DECOMMISSIONED' | 'UNAVAILABLE';
  themePreset: 'EDITORIAL_FANTASY' | 'DARK_STRATEGY' | 'PLAYFUL_CASUAL' | 'SCI_FI_SHOOTER';
  number: string;
  title: string;
  titleLines?: string[];
  slogan: string;
  synopsis: string;
  category: 'MMORPG' | 'Chiến thuật' | 'Casual' | 'Bắn súng';
  categoryDisplay: string;
  platforms: string[];
  status: 'Đang phát triển' | 'Concept' | 'Thử nghiệm' | 'Sắp ra mắt' | 'Đang hoạt động' | 'Đã đóng';
  statusColor: 'emerald' | 'amber' | 'blue' | 'purple';
  isFeatured?: boolean;
  featuredBadge?: string;
  alt: string;
  focalPoint?: string;
  preRegisterReward?: string;
  features: GameFeature[];
  releaseTarget?: string;
  assets: {
    heroDesktop: string;
    heroMobile: string;
    thumbnail: string;
    avatar: string;
  };
  ctaText?: string;
  roadmapUrl?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

export interface NewsItem {
  id: string;
  category: 'Tiến độ phát triển' | 'Thông báo' | 'Sự kiện' | 'Bảo trì';
  categoryColor: 'emerald' | 'blue' | 'amber' | 'purple';
  gameTitle: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  readTime: string;
  href: string;
}

export function formatCategoryLabel(category?: string | null): string {
  if (!category) return 'Tin tức';
  switch (category) {
    case 'DEVELOPMENT_UPDATE':
    case 'Development Update':
    case 'Tiến độ phát triển':
      return 'Tiến độ phát triển';
    case 'ANNOUNCEMENT':
    case 'Announcement':
    case 'Thông báo':
      return 'Thông báo';
    case 'EVENT':
    case 'Event':
    case 'Sự kiện':
      return 'Sự kiện';
    case 'MAINTENANCE':
    case 'Maintenance':
    case 'Bảo trì':
      return 'Bảo trì';
    default:
      return category.replaceAll('_', ' ');
  }
}

export function gameItemFromSummary(summary: GameSummary): GameItem {
  const primaryGenre = summary.genres[0];
  const category = primaryGenre?.code === 'STRATEGY' || primaryGenre?.code === 'SLG'
    ? 'Chiến thuật'
    : primaryGenre?.code === 'CASUAL' || primaryGenre?.code === 'SIMULATION'
      ? 'Casual'
      : primaryGenre?.code === 'SHOOTER'
        ? 'Bắn súng'
        : 'MMORPG';
  const status: GameItem['status'] = summary.lifecycleStatus === 'IN_DEVELOPMENT'
    ? 'Đang phát triển'
    : summary.lifecycleStatus === 'LIVE' || summary.lifecycleStatus === 'OPEN_BETA'
      ? 'Đang hoạt động'
      : summary.lifecycleStatus === 'INTERNAL_TEST' || summary.lifecycleStatus === 'CLOSED_BETA'
        ? 'Thử nghiệm'
        : summary.lifecycleStatus === 'COMING_SOON'
          ? 'Sắp ra mắt'
          : summary.lifecycleStatus === 'SUNSET'
            ? 'Đã đóng'
            : 'Concept';
  const statusColor: GameItem['statusColor'] = summary.themePreset === 'DARK_STRATEGY'
    ? 'amber'
    : summary.themePreset === 'PLAYFUL_CASUAL'
      ? 'blue'
      : summary.themePreset === 'SCI_FI_SHOOTER'
        ? 'purple'
        : 'emerald';
  const platforms = summary.platforms.map((platform) => platform === 'MOBILE' ? 'Mobile' : platform === 'WEB' ? 'Web' : platform);
  const titleWords = summary.name.trim().split(/\s+/);
  const splitAt = Math.ceil(titleWords.length / 2);
  const titleLines = titleWords.length > 2 ? [titleWords.slice(0, splitAt).join(' '), titleWords.slice(splitAt).join(' ')] : undefined;
  const websiteUrl = gameUrl(summary.subdomain);
  return {
    id: summary.code,
    slug: summary.slug,
    subdomain: summary.subdomain,
    websiteUrl,
    recordType: summary.recordType,
    lifecycleStatus: summary.lifecycleStatus,
    operationalStatus: summary.operationalStatus,
    themePreset: summary.themePreset as GameItem['themePreset'],
    number: String(summary.sortOrder).padStart(2, '0'),
    title: summary.slug === 'luc-dia-dam-me' ? summary.name.toUpperCase() : summary.name,
    titleLines,
    slogan: summary.tagline,
    synopsis: summary.shortDescription,
    category,
    categoryDisplay: primaryGenre?.name ?? category,
    platforms,
    status,
    statusColor,
    isFeatured: summary.featured,
    featuredBadge: summary.featured ? 'Nổi bật' : undefined,
    alt: summary.name,
    features: [],
    releaseTarget: summary.releaseYear ? String(summary.releaseYear) : undefined,
    assets: {
      heroDesktop: summary.heroDesktopUrl ?? '',
      heroMobile: summary.heroMobileUrl ?? '',
      thumbnail: summary.coverUrl ?? '',
      avatar: summary.iconUrl ?? '',
    },
    ctaText: summary.primaryCtaLabel ?? 'Truy cập trang chủ',
    roadmapUrl: summary.secondaryCtaPath ? gameUrl(summary.subdomain, summary.secondaryCtaPath) : websiteUrl,
    primaryCtaText: summary.primaryCtaLabel ?? 'Truy cập trang chủ',
    primaryCtaUrl: summary.primaryCtaPath ? gameUrl(summary.subdomain, summary.primaryCtaPath) : websiteUrl,
    secondaryCtaText: summary.secondaryCtaLabel ?? 'Khám phá thêm',
    secondaryCtaUrl: summary.secondaryCtaPath ? gameUrl(summary.subdomain, summary.secondaryCtaPath) : websiteUrl,
  };
}

export function newsItemFromArticle(article: GameArticleSummary): NewsItem {
  const date = article.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(article.publishedAt))
    : '';
  const category = (article.category === 'ANNOUNCEMENT'
    ? 'Thông báo'
    : article.category === 'EVENT'
      ? 'Sự kiện'
      : article.category === 'MAINTENANCE'
        ? 'Bảo trì'
        : 'Tiến độ phát triển') as NewsItem['category'];
  const categoryColor = category === 'Thông báo' ? 'blue' : category === 'Sự kiện' ? 'amber' : category === 'Bảo trì' ? 'purple' : 'emerald';
  const gameTitle = article.game?.name ?? 'ZENX GO';
  const href = article.href ?? (article.game ? gameUrl(article.game.subdomain, `/tin-tuc/${article.slug}`) : `/news/${article.slug}`);
  const readTimeMinutes = article.readTimeMinutes ?? 1;
  return {
    id: `${article.game?.slug ?? 'zenx'}-${article.slug}`,
    category,
    categoryColor,
    gameTitle,
    title: article.title,
    description: article.excerpt,
    imageUrl: article.coverImageUrl ?? '',
    date,
    readTime: `${readTimeMinutes} phút đọc`,
    href,
  };
}
