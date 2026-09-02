import { notFound } from 'next/navigation';
import type { GameDetail } from '@zenx-go/api-client';
import { getGameBySubdomain } from './game-api';

export async function requireGameSection(gameKey: string, section: string): Promise<GameDetail> {
  const game = await getGameBySubdomain(gameKey);
  if (!game || !game.featureConfig.sections.includes(section)) notFound();
  const routeForSection: Record<string, 'ABOUT' | 'NEWS' | 'ROADMAP' | 'DOWNLOAD'> = {
    GAME_INTRODUCTION: 'ABOUT',
    ARTICLE_GRID: 'NEWS',
    ROADMAP_PREVIEW: 'ROADMAP',
    PLATFORM_CARDS: 'DOWNLOAD',
  };
  const route = routeForSection[section];
  const configuredRoutes = game.featureConfig.routes;
  // Older REAL records may not have routes; retain section-based behavior for those records.
  if (route && configuredRoutes && !configuredRoutes.includes(route)) notFound();
  if (route && !configuredRoutes && game.recordType === 'DEMO') notFound();
  return game;
}
