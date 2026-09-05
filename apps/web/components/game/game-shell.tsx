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
  const isThiTranMay = game.themePreset === 'PLAYFUL_CASUAL';
  const isLucDiaDamMe = game.themePreset === 'EDITORIAL_FANTASY';
  const isHoaLong = game.themePreset === 'DARK_STRATEGY';
  const isOrion = game.themePreset === 'SCI_FI_SHOOTER';
  const routeEnabled = (route: 'ABOUT' | 'NEWS' | 'ROADMAP' | 'DOWNLOAD', section: string) => {
    if (!game.featureConfig.sections.includes(section)) return false;
    const configuredRoutes = game.featureConfig.routes;
    return configuredRoutes ? configuredRoutes.includes(route) : game.recordType !== 'DEMO';
  };

  const standardNavItems = [
    ['/', 'Trang chủ', true],
    ['/gioi-thieu', 'Giới thiệu', routeEnabled('ABOUT', 'GAME_INTRODUCTION')],
    ['/tin-tuc', 'Tin tức', routeEnabled('NEWS', 'ARTICLE_GRID')],
    ['/roadmap', 'Roadmap', routeEnabled('ROADMAP', 'ROADMAP_PREVIEW')],
    ['/tai-game', 'Tải game', routeEnabled('DOWNLOAD', 'PLATFORM_CARDS') && game.featureConfig.downloads === true],
  ].filter(([, , visible]) => visible) as Array<[string, string, boolean]>;

  const handleScroll = (href: string) => {
    if (href.startsWith('/')) {
      window.location.assign(gameUrl(game.subdomain, href));
      setOpen(false);
      return;
    }
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setOpen(false);
        return;
      }
      const pageByAnchor: Record<string, string> = {
        '#gioi-thieu': '/gioi-thieu',
        '#the-gioi': '/gioi-thieu',
        '#thi-tran': '/',
        '#y-tuong': '/',
        '#nen-tang': '/tai-game',
        '#nhat-ky': '/tin-tuc',
        '#roadmap': '/roadmap',
        '#chien-truong': '/',
        '#binh-chung': '/',
        '#chien-dia': '/',
      };
      const page = pageByAnchor[href];
      if (page) window.location.assign(gameUrl(game.subdomain, page));
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.surface, color: theme.text, ['--game-primary' as string]: theme.primary, ['--game-secondary' as string]: theme.secondary ?? theme.primary }}>
      {/* Top Global Bar */}
      <div className={`border-b ${
        isLucDiaDamMe
          ? 'border-black/5 bg-[#fafaf8]/80 text-[#152238]/80 backdrop-blur-md'
          : isThiTranMay
          ? 'border-black/5 bg-[#e3f2fb]/90 text-[#123b63]/80 backdrop-blur-md'
          : isHoaLong
          ? 'border-[#251b14] bg-[#070706] text-[#ead8b5]/80'
          : isOrion
          ? 'border-slate-800 bg-[#070b14] text-slate-300'
          : 'border-white/10 bg-slate-950 text-white/80'
      } text-xs font-semibold`}>
        <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={portalUrl('/')}
            className={`inline-flex items-center gap-2 transition-colors ${
              isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : isHoaLong ? 'hover:text-amber-300' : isOrion ? 'hover:text-cyan-300' : 'hover:text-white'
            }`}
            aria-label="Quay lại ZENX GO"
          >
            <ArrowLeft className="size-3.5" /> <span>ZENX GO</span>
          </Link>
          <div className="flex items-center gap-4 text-xs">
            {account.data ? (
              <Link
                href={portalUrl('/account')}
                className={`flex items-center gap-1.5 transition-colors ${
                  isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : isHoaLong ? 'hover:text-amber-300' : isOrion ? 'hover:text-cyan-300' : 'hover:text-white'
                }`}
              >
                <UserRound className="size-3.5" /> <span>{account.data.email || 'Tài khoản'}</span>
              </Link>
            ) : (
              <Link
                href={loginUrl}
                className={`flex items-center gap-1.5 transition-colors ${
                  isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : isHoaLong ? 'hover:text-amber-300' : isOrion ? 'hover:text-cyan-300' : 'hover:text-white'
                }`}
              >
                <UserRound className="size-3.5" /> <span>Tài khoản</span>
              </Link>
            )}
            <span className="opacity-30">|</span>
            <Link
              href={portalUrl('/support')}
              className={`transition-colors ${
                isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : isHoaLong ? 'hover:text-amber-300' : isOrion ? 'hover:text-cyan-300' : 'hover:text-white'
              }`}
            >
              Hỗ trợ
            </Link>
          </div>
        </div>
      </div>

      {/* Main Game Header */}
      <header className={`sticky top-0 z-40 ${
        isThiTranMay
          ? 'border-b border-transparent bg-[#e3f2fb]/90 backdrop-blur-md'
          : isLucDiaDamMe
          ? 'border-b border-black/5 bg-[#fafaf8]/85 backdrop-blur-md shadow-2xs'
          : isHoaLong
          ? 'border-b border-[#251b14] bg-[#0c0b0a]/95 backdrop-blur-md shadow-lg'
          : isOrion
          ? 'border-b border-slate-800 bg-[#0a0f1d]/95 backdrop-blur-md shadow-lg text-white'
          : 'border-b border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-xs'
      }`}>
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href={gameUrl(game.subdomain, '/')} className="flex items-center gap-2.5">
              {game.iconUrl ? <img src={game.iconUrl} alt="" className="size-8 rounded-lg object-cover" /> : null}
              <span className="text-base sm:text-lg font-black tracking-tight">{game.name}</span>
              {game.lifecycleStatus === 'LIVE' ? <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">Đang hoạt động</span> : null}
            </Link>
          </div>

          {/* Desktop Nav: every template uses the same feature-configured routes. */}
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            {standardNavItems.map(([href, label]) => (
              <Link key={href} href={gameUrl(game.subdomain, href)} className="hover:text-[var(--game-primary)]">
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Header Action */}
          <div className="flex items-center gap-3">
            {isThiTranMay ? (
              <button
                type="button"
                onClick={() => handleScroll('/tin-tuc')}
                className="hidden sm:inline-flex min-h-10 items-center justify-center rounded-full border-2 border-[#118a94] bg-white px-6 text-sm font-bold text-[#118a94] hover:bg-[#118a94]/10 transition-colors shadow-xs"
              >
                Xem tin tức
              </button>
            ) : isLucDiaDamMe ? (
              <Link
                href={gameUrl(game.subdomain, '/tin-tuc')}
                className="hidden sm:inline-flex min-h-10 items-center justify-center rounded-lg border border-[#c6aa73] bg-[#fbf7ee] px-6 text-xs font-semibold text-[#2a2115] hover:bg-[#f5eedc] transition-colors shadow-xs"
              >
                Xem tin tức
              </Link>
            ) : isHoaLong ? (
              account.data ? (
                <Link
                  href={portalUrl('/account')}
                  className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-amber-500/30 bg-amber-950/40 text-amber-300"
                  aria-label="Tài khoản"
                >
                  {mediaUrl(account.data.profile?.avatarUrl) ? (
                    <img src={mediaUrl(account.data.profile.avatarUrl)} alt="" className="size-full object-cover" />
                  ) : (
                    <UserRound className="size-4" />
                  )}
                </Link>
              ) : (
                <Link
                  href={loginUrl}
                  className="hidden sm:inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#c85a17] to-[#a53b13] hover:from-[#d96620] hover:to-[#b74316] px-5 text-xs font-bold text-white shadow-md transition-all active:scale-98"
                >
                  <LogIn className="size-3.5" />
                  <span>Đăng nhập</span>
                </Link>
              )
            ) : isOrion ? (
              account.data ? (
                <Link
                  href={portalUrl('/account')}
                  className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300"
                  aria-label="Tài khoản"
                >
                  {mediaUrl(account.data.profile?.avatarUrl) ? (
                    <img src={mediaUrl(account.data.profile.avatarUrl)} alt="" className="size-full object-cover" />
                  ) : (
                    <UserRound className="size-4" />
                  )}
                </Link>
              ) : (
                <Link
                  href={loginUrl}
                  className="hidden sm:inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 text-xs font-bold text-white shadow-md transition-all active:scale-98 font-mono"
                >
                  <LogIn className="size-3.5" />
                  <span>ĐĂNG NHẬP</span>
                </Link>
              )
            ) : (
              <>
                {account.data ? <Link href={portalUrl('/payment')} className="hidden items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold sm:inline-flex"><Coins className="size-3.5" /> {formatAmount(wallet.data?.balance ?? 0)} Coin</Link> : null}
                {account.data ? <Link href={portalUrl('/account')} className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-black/5" aria-label="Tài khoản">{mediaUrl(account.data.profile?.avatarUrl) ? <img src={mediaUrl(account.data.profile.avatarUrl)} alt="" className="size-full object-cover" /> : <UserRound className="size-4" />}</Link> : <Link href={loginUrl} className="hidden min-h-10 items-center gap-2 rounded-full bg-[var(--game-primary)] px-4 text-xs font-bold text-white sm:inline-flex"><LogIn className="size-3.5" /> Đăng nhập</Link>}
              </>
            )}
            <button
              type="button"
              className={`flex size-10 items-center justify-center rounded-xl border md:hidden ${
                isHoaLong
                  ? 'border-amber-500/30 bg-amber-950/40 text-amber-300'
                  : isOrion
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300'
                  : isLucDiaDamMe
                  ? 'border-black/10 text-[#152238]'
                  : isThiTranMay
                  ? 'border-black/10 text-[#123b63]'
                  : 'border-white/20 text-white'
              }`}
              onClick={() => setOpen((value) => !value)}
              aria-label="Mở menu"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {open ? (
          <nav className={`border-t px-4 py-3 md:hidden ${
            isHoaLong
              ? 'border-[#251b14] bg-[#0e0d0b] text-[#ead8b5]'
              : isOrion
              ? 'border-slate-800 bg-[#070b14] text-slate-300 font-mono'
              : isThiTranMay
              ? 'border-black/10 bg-white text-[#123b63]'
              : isLucDiaDamMe
              ? 'border-black/10 bg-white text-[#152238]'
              : 'border-white/10 bg-slate-950 text-white'
          }`}>
            <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold">
              {standardNavItems.map(([href, label]) => (
                <Link key={href} href={gameUrl(game.subdomain, href)} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 hover:bg-white/10">
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </header>

      {game.operationalStatus !== 'AVAILABLE' ? <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{game.operationalStatus === 'MAINTENANCE' ? 'Website đang bảo trì.' : game.operationalStatus === 'DEGRADED' ? 'Một số tính năng có thể tạm thời không ổn định.' : 'Game hiện chưa khả dụng.'}</div> : null}

      <main>{children}</main>

      <footer className="border-t border-black/10 bg-black/[0.03] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm opacity-75 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {game.name}. Một sản phẩm trong hệ sinh thái ZENX GO.</p>
          <div className="flex gap-4">
            <Link href={portalUrl('/terms')} className="hover:opacity-100">Điều khoản</Link>
            <Link href={portalUrl('/privacy')} className="hover:opacity-100">Bảo mật</Link>
            <Link href={portalUrl('/support')} className="hover:opacity-100">Hỗ trợ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
