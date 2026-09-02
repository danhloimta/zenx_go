'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowLeft, Coins, LogIn, Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import type { GameDetail } from '@zenx-go/api-client';
import { useAccount } from '@/hooks/use-account';
import { useWallet } from '@/hooks/use-wallet';
import { formatAmount, mediaUrl } from '@/lib/utils';
import { gameUrl, portalUrl } from '@/lib/domain';
import { GameProvider, useGame } from './game-context';

export function GameShell({ game, children }: { game: GameDetail; children: React.ReactNode }) {
  return <GameProvider game={game}><GameFrame>{children}</GameFrame></GameProvider>;
}

function GameFrame({ children }: { children: React.ReactNode }) {
  const game = useGame();
  const account = useAccount();
  const wallet = useWallet({ enabled: Boolean(account.data) });
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const currentUrl = new URL(gameUrl(game.subdomain, pathname || '/'));
  currentUrl.search = searchParams.toString();
  const loginUrl = `${portalUrl('/auth/login')}?returnTo=${encodeURIComponent(currentUrl.toString())}`;
  const theme = game.theme;
  const isFullWebsite = game.recordType !== 'DEMO';
  const navItems = [
    ['/', 'Trang chủ', true],
    ['/gioi-thieu', 'Giới thiệu', isFullWebsite && game.featureConfig.sections.includes('GAME_INTRODUCTION')],
    ['/tin-tuc', 'Tin tức', isFullWebsite && game.featureConfig.sections.includes('ARTICLE_GRID')],
    ['/roadmap', 'Roadmap', isFullWebsite && game.featureConfig.sections.includes('ROADMAP_PREVIEW')],
    ['/tai-game', 'Tải game', isFullWebsite && game.featureConfig.sections.includes('PLATFORM_CARDS')],
  ].filter(([, , visible]) => visible) as Array<[string, string, boolean]>;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.surface, color: theme.text, ['--game-primary' as string]: theme.primary, ['--game-secondary' as string]: theme.secondary ?? theme.primary }}>
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href={portalUrl('/')} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold opacity-70 transition-opacity hover:opacity-100" aria-label="Quay lại Game Hub">
              <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Game Hub</span>
            </Link>
            <span className="h-6 w-px bg-black/10" />
            <Link href={gameUrl(game.subdomain, '/')} className="flex items-center gap-2 text-sm font-bold">
              {game.iconUrl ? <img src={game.iconUrl} alt="" className="size-8 rounded-lg object-cover" /> : null}
              <span>{game.name}</span>
              {game.recordType === 'DEMO' ? <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">Demo</span> : null}
            </Link>
          </div>
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">{navItems.map(([href, label]) => <Link key={href} href={gameUrl(game.subdomain, href)} className="hover:text-[var(--game-primary)]">{label}</Link>)}</nav>
          <div className="flex items-center gap-2">
            {account.data ? <Link href={portalUrl('/payment')} className="hidden items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold sm:inline-flex"><Coins className="size-3.5" /> {formatAmount(wallet.data?.balance ?? 0)} Coin</Link> : null}
            {account.data ? <Link href={portalUrl('/account')} className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-black/5" aria-label="Tài khoản">{mediaUrl(account.data.profile?.avatarUrl) ? <img src={mediaUrl(account.data.profile.avatarUrl)} alt="" className="size-full object-cover" /> : <UserRound className="size-4" />}</Link> : <Link href={loginUrl} className="hidden min-h-10 items-center gap-2 rounded-full bg-[var(--game-primary)] px-4 text-xs font-bold text-white sm:inline-flex"><LogIn className="size-3.5" /> Đăng nhập</Link>}
            <button type="button" className="flex size-10 items-center justify-center rounded-xl border border-black/10 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Mở menu">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          </div>
        </div>
        {open ? <nav className="border-t border-black/10 bg-white px-4 py-3 md:hidden"><div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold">{navItems.map(([href, label]) => <Link key={href} href={gameUrl(game.subdomain, href)} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 hover:bg-black/5">{label}</Link>)}{!account.data ? <Link href={loginUrl} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-[var(--game-primary)]">Đăng nhập</Link> : null}</div></nav> : null}
      </header>
      {game.operationalStatus !== 'AVAILABLE' ? <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{game.operationalStatus === 'MAINTENANCE' ? 'Website đang bảo trì.' : game.operationalStatus === 'DEGRADED' ? 'Một số tính năng có thể tạm thời không ổn định.' : 'Game hiện chưa khả dụng.'}</div> : null}
      <main>{children}</main>
      <footer className="border-t border-black/10 bg-black/[0.03] px-4 py-10 sm:px-6"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm opacity-75 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} {game.name}. Một sản phẩm trong hệ sinh thái ZENX GO.</p><div className="flex gap-4"><Link href={portalUrl('/terms')} className="hover:opacity-100">Điều khoản</Link><Link href={portalUrl('/privacy')} className="hover:opacity-100">Bảo mật</Link><Link href={portalUrl('/support')} className="hover:opacity-100">Hỗ trợ</Link></div></div></footer>
    </div>
  );
}
