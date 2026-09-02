import { notFound } from 'next/navigation';
import type { GameDetail } from '@zenx-go/api-client';
import { getGameBySubdomain } from './game-api';

export async function requireGameSection(gameKey: string, section: string): Promise<GameDetail> {
  const game = await getGameBySubdomain(gameKey);
  if (!game || game.recordType === 'DEMO' || !game.featureConfig.sections.includes(section)) notFound();
  return game;
}
