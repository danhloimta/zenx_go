import { requireGameSection } from '@/lib/game-routes';

export default async function GameAboutLayout({ children, params }: { children: React.ReactNode; params: Promise<{ gameKey: string }> }) {
  await requireGameSection((await params).gameKey, 'GAME_INTRODUCTION');
  return children;
}
