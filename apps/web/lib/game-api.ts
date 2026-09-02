import type { GameDetail } from '@zenx-go/api-client';
import { serverApi } from './api';
import { GAMES_DATA, NEWS_DATA, gameItemFromSummary, newsItemFromArticle, type GameItem, type NewsItem } from './games-data';

export async function getGameBySubdomain(subdomain: string): Promise<GameDetail | null> {
  try {
    return await withTimeout(serverApi.games.bySubdomain(subdomain));
  } catch {
    return process.env.NODE_ENV === 'production' ? null : fallbackGameDetail(subdomain);
  }
}

export async function getGameBySlug(slug: string): Promise<GameDetail | null> {
  try {
    return await withTimeout(serverApi.games.bySlug(slug));
  } catch {
    return process.env.NODE_ENV === 'production' ? null : fallbackGameDetail(slug);
  }
}

function fallbackGameDetail(key: string): GameDetail | null {
  const item = GAMES_DATA.find((g) => g.slug === key || g.subdomain === key);
  if (!item) return null;
  return {
    code: item.id === '1' ? 'LDDM' : item.id === '2' ? 'VTHL' : item.id === '3' ? 'TTM' : 'CTO',
    name: item.title,
    slug: item.slug,
    subdomain: item.subdomain,
    recordType: item.recordType,
    tagline: item.slogan,
    shortDescription: item.synopsis,
    longDescription: item.synopsis,
    lifecycleStatus: item.lifecycleStatus,
    operationalStatus: (item.operationalStatus === 'DECOMMISSIONED' ? 'UNAVAILABLE' : item.operationalStatus) as 'AVAILABLE' | 'MAINTENANCE' | 'DEGRADED' | 'UNAVAILABLE',
    releaseYear: item.releaseTarget ? parseInt(item.releaseTarget.replace(/\D/g, '')) || null : null,
    themePreset: item.themePreset,
    featured: item.isFeatured ?? false,
    primaryGame: item.slug === 'luc-dia-dam-me',
    sortOrder: parseInt(item.number) || 1,
    genres: [{
      code: item.category === 'Casual' ? 'CASUAL' : item.category === 'Chiến thuật' ? 'STRATEGY' : item.category === 'Bắn súng' ? 'SHOOTER' : 'MMORPG',
      name: item.categoryDisplay,
      slug: item.category === 'Casual' ? 'casual' : item.category === 'Chiến thuật' ? 'chien-thuat' : item.category === 'Bắn súng' ? 'ban-sung' : 'mmorpg',
    }],
    platforms: item.platforms.map((p) => p.toUpperCase() as any),
    heroDesktopUrl: item.assets.heroDesktop,
    heroMobileUrl: item.assets.heroMobile,
    coverUrl: item.assets.thumbnail,
    iconUrl: item.assets.avatar,
    logoUrl: item.assets.avatar,
    theme: {
      primary: item.slug === 'thi-tran-may' ? '#118a94' : item.themePreset === 'DARK_STRATEGY' ? '#9b4938' : item.themePreset === 'PLAYFUL_CASUAL' ? '#69bce8' : '#6c8cff',
      secondary: item.slug === 'thi-tran-may' ? '#f6c958' : '#f6c958',
      surface: item.slug === 'thi-tran-may' ? '#f7fbff' : '#fffdf7',
      text: item.slug === 'thi-tran-may' ? '#123b63' : '#193b5a',
      heading: 'rounded-sans',
      body: 'sans-serif',
      radius: 'large',
      motion: 'playful',
    },
    featureConfig: {
      sections: ['HERO', 'GAME_INTRODUCTION', 'FEATURE_GRID', 'COMMUNITY_CTA'],
      downloads: 'COMING_SOON',
    },
    articles: [],
    milestones: [],
  };
}

export async function getPortalGames(): Promise<GameItem[]> {
  const fallback = fallbackGames();
  try {
    const result = await withTimeout(serverApi.games.list());
    return result.items.length ? result.items.map(gameItemFromSummary) : fallback;
  } catch {
    return fallback;
  }
}

function fallbackGames() {
  if (process.env.NODE_ENV === 'production' && process.env.GAME_DEMO_PUBLIC !== 'true') {
    return GAMES_DATA.filter((game) => game.recordType !== 'DEMO');
  }
  return GAMES_DATA;
}

export async function getPortalNews(): Promise<NewsItem[]> {
  try {
    const result = await withTimeout(serverApi.games.articles('luc-dia-dam-me'));
    return result.items.length ? result.items.map((article, index) => newsItemFromArticle(article, index)) : NEWS_DATA;
  } catch {
    return NEWS_DATA;
  }
}

async function withTimeout<T>(promise: Promise<T>, milliseconds = 3000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error('Game API timeout')), milliseconds); }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
