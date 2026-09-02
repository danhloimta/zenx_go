import type { GameDetail } from '@zenx-go/api-client';
import { serverApi } from './api';
import { GAMES_DATA, NEWS_DATA, gameItemFromSummary, newsItemFromArticle, type GameItem, type NewsItem } from './games-data';

export async function getGameBySubdomain(subdomain: string): Promise<GameDetail | null> {
  try {
    return await withTimeout(serverApi.games.bySubdomain(subdomain));
  } catch {
    return null;
  }
}

export async function getGameBySlug(slug: string): Promise<GameDetail | null> {
  try {
    return await withTimeout(serverApi.games.bySlug(slug));
  } catch {
    return null;
  }
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
