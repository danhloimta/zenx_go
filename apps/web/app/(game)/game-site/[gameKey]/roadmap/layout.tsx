import { requireGameSection } from '@/lib/game-routes';

export default async function GameRoadmapLayout({ children, params }: { children: React.ReactNode; params: Promise<{ gameKey: string }> }) {
  await requireGameSection((await params).gameKey, 'ROADMAP_PREVIEW');
  return children;
}
