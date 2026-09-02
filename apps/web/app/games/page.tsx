import type { Metadata } from 'next';
import { getPortalGames } from '@/lib/game-api';
import { PortalPageLayout } from '@/components/portal/portal-page-layout';
import { GamesCatalogClient } from '@/components/portal/games-catalog-client';

export const metadata: Metadata = {
  title: 'Kho Trò Chơi | ZENX GO Game Hub',
  description: 'Khám phá tất cả các tựa game thế hệ mới từ MMORPG thần thoại, chiến thuật thời gian thực đến bắn súng sci-fi trong hệ sinh thái ZENX GO.',
};

export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  const games = await getPortalGames();
  return (
    <PortalPageLayout games={games}>
      <GamesCatalogClient initialGames={games} />
    </PortalPageLayout>
  );
}
