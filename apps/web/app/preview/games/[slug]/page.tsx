import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGameBySlug } from '@/lib/game-api';
import { GameShell } from '@/components/game/game-shell';
import GameHomePage from '@/app/(game)/game-site/[gameKey]/page';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Game preview | ZENX GO', robots: { index: false, follow: false } };
}

export default async function GamePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();
  return <GameShell game={game}><GameHomePage /></GameShell>;
}
