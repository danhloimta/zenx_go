import { requireGameSection } from '@/lib/game-routes';

export default async function GameDownloadLayout({ children, params }: { children: React.ReactNode; params: Promise<{ gameKey: string }> }) {
  await requireGameSection((await params).gameKey, 'PLATFORM_CARDS');
  return children;
}
