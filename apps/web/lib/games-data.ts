import type { GameSummary, GameArticleSummary } from '@zenx-go/api-client';
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
  subtitle?: string;
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
  releaseTarget?: string;
  preRegisterReward?: string;
  features: GameFeature[];
  assets: {
    heroDesktop: string;
    heroMobile: string;
    thumbnail: string;
    avatar: string;
  };
  ctaText?: string;
  roadmapUrl?: string;
}

export interface NewsItem {
  id: string;
  category: 'Development Update' | 'Thông báo' | 'Sự kiện' | 'Bảo trì';
  categoryColor: 'emerald' | 'blue' | 'amber' | 'purple';
  gameTitle: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  readTime: string;
  href: string;
}

export const GAMES_DATA: GameItem[] = [
  {
    id: '1',
    slug: 'luc-dia-dam-me',
    subdomain: 'lucdia',
    websiteUrl: gameUrl('lucdia'),
    recordType: 'REAL',
    lifecycleStatus: 'IN_DEVELOPMENT',
    operationalStatus: 'AVAILABLE',
    themePreset: 'EDITORIAL_FANTASY',
    number: '01',
    title: 'LỤC ĐỊA ĐAM MÊ',
    titleLines: ['LỤC ĐỊA', 'ĐAM MÊ'],
    slogan: 'Một thế giới đang được xây dựng lại.',
    synopsis: 'Thế giới MMORPG thần thoại kỳ ảo mở ra hành trình của các kỵ sĩ cánh trắng khám phá vùng đất giữa tầng mây, tham gia các trận công thành chiến quy mô lớn và săn boss huyền thoại.',
    category: 'MMORPG',
    categoryDisplay: 'MMORPG',
    platforms: ['PC', 'Mobile', 'Web'],
    status: 'Đang phát triển',
    statusColor: 'emerald',
    isFeatured: true,
    featuredBadge: 'Nổi bật',
    releaseTarget: 'Năm 2027',
    preRegisterReward: 'Cánh Thiên Thần Ánh Sáng + 1,000 ZENX Coin tân thủ',
    features: [
      { icon: 'Swords', title: 'Công Thành Chiến Khốc Liệt', desc: 'Chiến trường hàng trăm người cùng lúc giành quyền kiểm soát thủ phủ.' },
      { icon: 'Shield', title: 'Hệ Thống Cánh & Thần Thú', desc: 'Tự do bay lượn trên không trung và sở hữu thú cưỡi độc bản.' },
      { icon: 'Zap', title: 'Giao Dịch Tự Do', desc: 'Thị trường tự do giao thương vật phẩm không giới hạn.' },
    ],
    alt: 'Kỵ sĩ có cánh của Lục Địa Đam Mê trên thành phố giữa mây',
    focalPoint: '78% 45%',
    assets: {
      heroDesktop: '/images/games/luc-dia-dam-me/hero1.png',
      heroMobile: '/images/games/luc-dia-dam-me/hero-mobile.webp',
      thumbnail: '/images/games/luc-dia-dam-me/thumbnail.webp',
      avatar: '/images/games/luc-dia-dam-me/avatar.webp',
    },
    ctaText: 'Khám phá',
    roadmapUrl: gameUrl('lucdia', '/roadmap'),
  },
  {
    id: '2',
    slug: 'vuong-trieu-hoa-long',
    subdomain: 'hoalong',
    websiteUrl: gameUrl('hoalong'),
    recordType: 'DEMO',
    lifecycleStatus: 'COMING_SOON',
    operationalStatus: 'AVAILABLE',
    themePreset: 'DARK_STRATEGY',
    number: '02',
    title: 'Vương Triều Hỏa Long',
    titleLines: ['Vương Triều', 'Hỏa Long'],
    slogan: 'Xây dựng vương triều, thống lĩnh chiến trường.',
    synopsis: 'Game chiến thuật thời gian thực nơi bạn xây dựng đế chế, thuần hóa rồng lửa cổ đại và thống lĩnh liên minh quân đội chinh phạt lãnh thổ.',
    category: 'Chiến thuật',
    categoryDisplay: 'Chiến thuật',
    platforms: ['Mobile', 'Web'],
    status: 'Sắp ra mắt',
    statusColor: 'amber',
    releaseTarget: 'Năm 2027',
    preRegisterReward: 'Trứng Hỏa Long Thượng Cổ + Gói tài nguyên khởi đầu',
    features: [
      { icon: 'Flame', title: 'Thuần Hóa Long Thần', desc: 'Nuôi dưỡng và điều khiển các chủng rồng với chiêu thức hủy diệt.' },
      { icon: 'Crown', title: 'Xây Dựng Hoàng Triều', desc: 'Quy hoạch kinh thành, nghiên cứu khoa kỹ và củng cố quốc phòng.' },
      { icon: 'Users', title: 'Liên Minh Bang Hội', desc: 'Hợp sức cùng đồng minh chia cắt bản đồ thế giới.' },
    ],
    alt: 'Hỏa long trên vương quốc núi lửa và đội quân đang tiến vào thành',
    focalPoint: '75% 38%',
    assets: {
      heroDesktop: '/images/games/vuong-trieu-hoa-long/hero-desktop.webp',
      heroMobile: '/images/games/vuong-trieu-hoa-long/hero-mobile.webp',
      thumbnail: '/images/games/vuong-trieu-hoa-long/thumbnail.webp',
      avatar: '/images/games/vuong-trieu-hoa-long/avatar.webp',
    },
    ctaText: 'Tìm hiểu dự án',
    roadmapUrl: gameUrl('hoalong'),
  },
  {
    id: '3',
    slug: 'thi-tran-may',
    subdomain: 'thitranmay',
    websiteUrl: gameUrl('thitranmay'),
    recordType: 'DEMO',
    lifecycleStatus: 'CONCEPT',
    operationalStatus: 'AVAILABLE',
    themePreset: 'PLAYFUL_CASUAL',
    number: '03',
    title: 'Thị Trấn Mây',
    titleLines: ['Thị Trấn Mây'],
    slogan: 'Nông trại bồng bềnh, gắn kết bạn bè.',
    synopsis: 'Tựa game nông trại và xây dựng cộng đồng ấm áp trên các đảo bay. Tự tay trang trí ngôi nhà mơ ước, trồng cây thần nông và giao lưu với bạn bè khắp nơi.',
    category: 'Casual',
    categoryDisplay: 'Casual',
    platforms: ['Mobile', 'Web'],
    status: 'Concept',
    statusColor: 'blue',
    releaseTarget: 'Năm 2027',
    preRegisterReward: 'Trang phục Thủy Thủ Mây + Khinh khí cầu đặc biệt',
    features: [
      { icon: 'Heart', title: 'Xây Dựng Đảo Bay', desc: 'Sáng tạo không gian sống tự do với hàng trăm đồ nội thất kỳ ảo.' },
      { icon: 'Sun', title: 'Nông Trại Bồng Bềnh', desc: 'Trồng trọt, chăn nuôi sinh vật kỳ diệu và câu cá giữa trời.' },
      { icon: 'Smile', title: 'Gắn Kết Bạn Bè', desc: 'Tham gia các bữa tiệc trà, lễ hội pháo hoa và mini-game hấp dẫn.' },
    ],
    alt: 'Thị trấn và tháp đồng hồ trên hòn đảo nổi giữa bầu trời',
    focalPoint: '65% 48%',
    assets: {
      heroDesktop: '/images/games/thi-tran-may/hero-desktop.webp',
      heroMobile: '/images/games/thi-tran-may/hero-mobile.webp',
      thumbnail: '/images/games/thi-tran-may/thumbnail.webp',
      avatar: '/images/games/thi-tran-may/avatar.webp',
    },
    ctaText: 'Tìm hiểu dự án',
    roadmapUrl: gameUrl('thitranmay'),
  },
  {
    id: '4',
    slug: 'chien-tuyen-orion',
    subdomain: 'orion',
    websiteUrl: gameUrl('orion'),
    recordType: 'DEMO',
    lifecycleStatus: 'CONCEPT',
    operationalStatus: 'AVAILABLE',
    themePreset: 'SCI_FI_SHOOTER',
    number: '04',
    title: 'Chiến Tuyến Orion',
    titleLines: ['Chiến Tuyến', 'Orion'],
    slogan: 'Biệt đội tinh nhuệ bảo vệ thuộc địa không gian.',
    synopsis: 'Game bắn súng chiến thuật khoa học viễn tưởng (Sci-Fi Tactical Shooter) góc nhìn thứ ba, nơi các đặc vụ Orion phối hợp hỏa lực ngăn chặn các cuộc xâm lăng ngoài thiên hà.',
    category: 'Bắn súng',
    categoryDisplay: 'Bắn súng',
    platforms: ['PC', 'Mobile'],
    status: 'Concept',
    statusColor: 'purple',
    releaseTarget: 'Năm 2027',
    preRegisterReward: 'Skin Súng Năng Lượng Plasma + Huy hiệu Đặc vụ Orion',
    features: [
      { icon: 'Crosshair', title: 'Đấu Súng Chiến Thuật', desc: 'Phối hợp kỹ năng đặc vụ và địa hình chiến đấu khoa học viễn tưởng.' },
      { icon: 'Bot', title: 'Bộ Giáp Mecha', desc: 'Triệu hồi chiến giáp trợ chiến với hỏa lực hạng nặng.' },
      { icon: 'Sparkles', title: 'Đồ Họa Unreal Engine', desc: 'Môi trường trạm không gian chân thực với hiệu ứng ánh sáng đỉnh cao.' },
    ],
    alt: 'Biệt đội Orion tiến qua thuộc địa không gian giữa cơn bão năng lượng',
    focalPoint: '72% 43%',
    assets: {
      heroDesktop: '/images/games/chien-tuyen-orion/hero-desktop.webp',
      heroMobile: '/images/games/chien-tuyen-orion/hero-mobile.webp',
      thumbnail: '/images/games/chien-tuyen-orion/thumbnail.webp',
      avatar: '/images/games/chien-tuyen-orion/avatar.webp',
    },
    ctaText: 'Tìm hiểu dự án',
    roadmapUrl: gameUrl('orion'),
  },
];

export function gameItemFromSummary(summary: GameSummary): GameItem {
  const fallback = GAMES_DATA.find((item) => item.slug === summary.slug);
  const primaryGenre = summary.genres[0];
  const category = primaryGenre?.code === 'STRATEGY' || primaryGenre?.code === 'SLG'
    ? 'Chiến thuật'
    : primaryGenre?.code === 'CASUAL' || primaryGenre?.code === 'SIMULATION'
      ? 'Casual'
      : primaryGenre?.code === 'SHOOTER'
        ? 'Bắn súng'
        : 'MMORPG';
  const status: GameItem['status'] = summary.lifecycleStatus === 'IN_DEVELOPMENT' ? 'Đang phát triển' : summary.lifecycleStatus === 'LIVE' || summary.lifecycleStatus === 'OPEN_BETA' ? 'Đang hoạt động' : summary.lifecycleStatus === 'INTERNAL_TEST' || summary.lifecycleStatus === 'CLOSED_BETA' ? 'Thử nghiệm' : summary.lifecycleStatus === 'COMING_SOON' ? 'Sắp ra mắt' : summary.lifecycleStatus === 'SUNSET' ? 'Đã đóng' : 'Concept';
  const statusColor: GameItem['statusColor'] = summary.themePreset === 'DARK_STRATEGY' ? 'amber' : summary.themePreset === 'PLAYFUL_CASUAL' ? 'blue' : summary.themePreset === 'SCI_FI_SHOOTER' ? 'purple' : 'emerald';
  const platforms = summary.platforms.map((platform) => platform === 'MOBILE' ? 'Mobile' : platform === 'WEB' ? 'Web' : platform);
  return {
    id: summary.code,
    slug: summary.slug,
    subdomain: summary.subdomain,
    websiteUrl: gameUrl(summary.subdomain),
    recordType: summary.recordType,
    lifecycleStatus: summary.lifecycleStatus,
    operationalStatus: summary.operationalStatus,
    themePreset: summary.themePreset as GameItem['themePreset'],
    number: fallback?.number ?? String(summary.sortOrder).padStart(2, '0'),
    title: fallback?.title ?? summary.name,
    titleLines: fallback?.titleLines,
    slogan: summary.tagline,
    synopsis: fallback?.synopsis ?? summary.shortDescription,
    category,
    categoryDisplay: primaryGenre?.name ?? category,
    platforms,
    status,
    statusColor,
    isFeatured: summary.featured,
    featuredBadge: fallback?.featuredBadge,
    alt: fallback?.alt ?? summary.name,
    focalPoint: fallback?.focalPoint,
    releaseTarget: summary.releaseYear ? String(summary.releaseYear) : undefined,
    preRegisterReward: fallback?.preRegisterReward,
    features: fallback?.features ?? [],
    assets: {
      heroDesktop: summary.heroDesktopUrl ?? fallback?.assets.heroDesktop ?? '',
      heroMobile: summary.heroMobileUrl ?? fallback?.assets.heroMobile ?? '',
      thumbnail: summary.coverUrl ?? fallback?.assets.thumbnail ?? '',
      avatar: summary.iconUrl ?? fallback?.assets.avatar ?? '',
    },
    ctaText: fallback?.ctaText,
    roadmapUrl: summary.lifecycleStatus === 'IN_DEVELOPMENT' ? gameUrl(summary.subdomain, '/roadmap') : gameUrl(summary.subdomain),
  };
}

const DEFAULT_NEWS_IMAGES = [
  '/images/games/vuong-trieu-hoa-long/hero-desktop.webp',
  '/images/games/luc-dia-dam-me/hero-desktop.webp',
  '/images/games/chien-tuyen-orion/hero-desktop.webp',
];

export function newsItemFromArticle(article: GameArticleSummary, index = 0): NewsItem {
  const date = article.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(article.publishedAt))
    : '28 Th08, 2026';
  const category = (article.category === 'ANNOUNCEMENT' ? 'Thông báo' : article.category === 'EVENT' ? 'Sự kiện' : article.category === 'MAINTENANCE' ? 'Bảo trì' : 'Development Update') as NewsItem['category'];
  const categoryColor = category === 'Thông báo' ? 'blue' : category === 'Sự kiện' ? 'amber' : category === 'Bảo trì' ? 'purple' : 'emerald';
  const fallbackImg = DEFAULT_NEWS_IMAGES[index % DEFAULT_NEWS_IMAGES.length] ?? '/images/games/luc-dia-dam-me/hero-desktop.webp';
  
  return {
    id: article.slug,
    category,
    categoryColor,
    gameTitle: index === 0 ? 'Vương Triều Hỏa Long' : index === 1 ? 'Lục Địa Đam Mê' : 'Chiến Tuyến Orion',
    title: article.title,
    description: article.excerpt,
    imageUrl: article.coverImageUrl ?? fallbackImg,
    date,
    readTime: '4 phút đọc',
    href: gameUrl('lucdia', `/tin-tuc/${article.slug}`),
  };
}

export const NEWS_DATA: NewsItem[] = [
  {
    id: 'news-1',
    category: 'Development Update',
    categoryColor: 'amber',
    gameTitle: 'Vương Triều Hỏa Long',
    title: 'Không gian gameplay là ưu tiên hàng đầu',
    description: 'Mỗi khung hình của Vương Triều Hỏa Long được xây dựng để thế giới thần thoại và nhân vật luôn là tâm điểm của trải nghiệm hành động.',
    imageUrl: '/images/games/vuong-trieu-hoa-long/hero-desktop.webp',
    date: '01 Th09, 2026',
    readTime: '3 phút đọc',
    href: gameUrl('lucdia', '/tin-tuc/khong-gian-gameplay-la-uu-tien'),
  },
  {
    id: 'news-2',
    category: 'Development Update',
    categoryColor: 'blue',
    gameTitle: 'Lục Địa Đam Mê',
    title: 'World Remake: Đại tu thế giới mở',
    description: 'Lộ trình đại tu toàn diện môi trường mở, hệ thống chiếu sáng và kiến trúc thành trì giữa tầng không mây.',
    imageUrl: '/images/games/luc-dia-dam-me/hero-desktop.webp',
    date: '28 Th08, 2026',
    readTime: '4 phút đọc',
    href: gameUrl('lucdia', '/tin-tuc/world-remake'),
  },
  {
    id: 'news-3',
    category: 'Development Update',
    categoryColor: 'purple',
    gameTitle: 'Chiến Tuyến Orion',
    title: 'Character Update: Tạo hình đặc vụ',
    description: 'Hướng tiếp cận mới cho tạo hình chiến giáp và hành trình của các đặc vụ trong thuộc địa không gian.',
    imageUrl: '/images/games/chien-tuyen-orion/hero-desktop.webp',
    date: '25 Th08, 2026',
    readTime: '5 phút đọc',
    href: gameUrl('lucdia', '/tin-tuc/character-update'),
  },
];

export const QUICK_TICKERS = [
  {
    badge: 'THÔNG BÁO MỚI',
    text: 'Lục Địa Đam Mê cập nhật tiến độ UI/UX',
    href: gameUrl('lucdia', '/tin-tuc'),
    iconType: 'broadcast',
  },
  {
    badge: 'ZENX COIN',
    text: 'Nạp Coin',
    href: '/payment',
    iconType: 'coin',
  },
  {
    badge: 'HỖ TRỢ',
    text: 'Trung tâm hỗ trợ',
    href: '/support',
    iconType: 'support',
  },
  {
    badge: 'DỊCH VỤ',
    text: 'Hệ thống hoạt động bình thường',
    href: '/support',
    iconType: 'status',
  },
];
