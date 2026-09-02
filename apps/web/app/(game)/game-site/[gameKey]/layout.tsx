import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGameBySubdomain } from '@/lib/game-api';
import { GameShell } from '@/components/game/game-shell';
import { gameUrl } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ gameKey: string }> }): Promise<Metadata> {
  const { gameKey } = await params;
  const game = await getGameBySubdomain(gameKey);
  if (!game) return { title: 'Game không khả dụng | ZENX GO', robots: { index: false, follow: false } };
  const canonical = gameUrl(game.subdomain);
  return { metadataBase: new URL(canonical), title: game.name, description: game.tagline, alternates: { canonical }, icons: game.iconUrl ? { icon: game.iconUrl } : undefined, openGraph: { title: game.name, description: game.tagline, url: canonical, images: game.coverUrl ? [game.coverUrl] : undefined } };
}

export default async function GameLayout({ children, params }: { children: React.ReactNode; params: Promise<{ gameKey: string }> }) {
  const { gameKey } = await params;
  const game = await getGameBySubdomain(gameKey);
  if (!game) notFound();
  return <GameShell game={game}>{children}</GameShell>;
}
