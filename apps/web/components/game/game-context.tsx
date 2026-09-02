'use client';

import { createContext, useContext } from 'react';
import type { GameDetail } from '@zenx-go/api-client';

const GameContext = createContext<GameDetail | null>(null);

export function GameProvider({ game, children }: { game: GameDetail; children: React.ReactNode }) {
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGame() {
  const game = useContext(GameContext);
  if (!game) throw new Error('useGame must be used inside GameProvider');
  return game;
}
