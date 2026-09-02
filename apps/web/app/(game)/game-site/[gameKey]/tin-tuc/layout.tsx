import { requireGameSection } from '@/lib/game-routes';

export default async function GameNewsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ gameKey: string }> }) {
  await requireGameSection((await params).gameKey, 'ARTICLE_GRID');
  return children;
}
