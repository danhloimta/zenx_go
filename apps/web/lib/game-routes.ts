import { notFound } from 'next/navigation';
import type { GameDetail } from '@zenx-go/api-client';
import { getGameBySubdomain } from './game-api';

export async function requireGameSection(gameKey: string, section: string): Promise<GameDetail> {
  const game = await getGameBySubdomain(gameKey);
  if (!game || !game.featureConfig.sections.includes(section)) notFound();
  if (game.recordType === 'DEMO') {
    const routeForSection: Record<string, 'ABOUT' | 'NEWS' | 'ROADMAP' | 'DOWNLOAD'> = {
      GAME_INTRODUCTION: 'ABOUT',
      ARTICLE_GRID: 'NEWS',
      ROADMAP_PREVIEW: 'ROADMAP',
      PLATFORM_CARDS: 'DOWNLOAD',
    };
    const route = routeForSection[section];
    if (!route || !game.featureConfig.routes?.includes(route)) notFound();
  }
  return game;
}
