import type { GameArticleDetail, GameDetail, PortalEventsResponse, PortalEventDetail, PortalHomeResponse, PortalNewsResponse } from '@zenx-go/api-client';
import { unstable_cache } from 'next/cache';
import { serverApi } from './api';
import { gameItemFromSummary, newsItemFromArticle, type GameItem, type NewsItem } from './games-data';

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

export async function getGameArticle(slug: string, articleSlug: string): Promise<GameArticleDetail | null> {
  try {
    return await withTimeout(serverApi.games.article(slug, articleSlug));
  } catch {
    return null;
  }
}

export async function getPortalGames(): Promise<GameItem[]> {
  try {
    const result = await withTimeout(serverApi.games.list());
    return result.items.map(gameItemFromSummary);
  } catch {
    return [];
  }
}

const cachedPortalHome = unstable_cache(
  () => serverApi.portal.home(),
  ['zenx-portal-home-live-v1'],
  { revalidate: 60, tags: ['portal-home'] },
);

export async function getPortalHome(): Promise<{ data: PortalHomeResponse | null; error: boolean }> {
  try {
    const fetchHome = process.env.NODE_ENV === 'development' ? () => serverApi.portal.home() : cachedPortalHome;
    return { data: await withTimeout(fetchHome()), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export async function getPortalNews(): Promise<NewsItem[]> {
  try {
    const result = await withTimeout(serverApi.portal.news({ pageSize: 3 }));
    return result.items.map(newsItemFromArticle);
  } catch {
    return [];
  }
}

export async function getPortalNewsPage(query: { game?: string; category?: string; page?: number; pageSize?: number } = {}): Promise<{ data: PortalNewsResponse | null; error: boolean }> {
  try {
    return { data: await withTimeout(serverApi.portal.news(query)), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export async function getPortalEventsPage(query: { game?: string; status?: string; page?: number; pageSize?: number } = {}): Promise<{ data: PortalEventsResponse | null; error: boolean }> {
  try {
    return { data: await withTimeout(serverApi.portal.events(query)), error: false };
  } catch {
    return { data: null, error: true };
  }
}

export async function getPortalEvent(slug: string): Promise<PortalEventDetail | null> {
  try {
    return await withTimeout(serverApi.portal.event(slug));
  } catch {
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, milliseconds = 10_000): Promise<T> {
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
