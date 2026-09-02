import { HomeFooter } from '@/components/home/home-footer';
import { HomeNavbar } from '@/components/home/home-navbar';
import { getPortalGames } from '@/lib/game-api';
import type { GameItem } from '@/lib/games-data';

export async function PortalPageLayout({ children, games: suppliedGames }: { children: React.ReactNode; games?: GameItem[] }) {
  const games = suppliedGames ?? await getPortalGames();
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <HomeNavbar />
      <main>{children}</main>
      <HomeFooter games={games} />
    </div>
  );
}
