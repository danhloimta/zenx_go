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
  const isThiTranMay = game.slug === 'thi-tran-may';
  const isLucDiaDamMe = game.slug === 'luc-dia-dam-me' || game.subdomain === 'lucdia';
  const routeEnabled = (route: 'ABOUT' | 'NEWS' | 'ROADMAP' | 'DOWNLOAD', section: string) => game.featureConfig.sections.includes(section) && (isFullWebsite || game.featureConfig.routes?.includes(route) === true);

  const thiTranMayNav = [
    ['#gioi-thieu', 'Giới thiệu'],
    ['#thi-tran', 'Thị trấn'],
    ['#y-tuong', 'Ý tưởng trải nghiệm'],
    ['#nen-tang', 'Nền tảng'],
    ...(routeEnabled('NEWS', 'ARTICLE_GRID') ? [['/tin-tuc', 'Tin tức']] : []),
  ];

  const lucDiaDamMeNav = [
    ['#gioi-thieu', 'Giới thiệu'],
    ['#the-gioi', 'Thế giới'],
    ['#nhat-ky', 'Nhật ký'],
    ['#roadmap', 'Roadmap'],
  ];

  const standardNavItems = [
    ['/', 'Trang chủ', true],
    ['/gioi-thieu', 'Giới thiệu', routeEnabled('ABOUT', 'GAME_INTRODUCTION')],
    ['/tin-tuc', 'Tin tức', routeEnabled('NEWS', 'ARTICLE_GRID')],
    ['/roadmap', 'Roadmap', routeEnabled('ROADMAP', 'ROADMAP_PREVIEW')],
    ['/tai-game', 'Tải game', routeEnabled('DOWNLOAD', 'PLATFORM_CARDS')],
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
          : 'border-black/10 bg-slate-950 text-white/80'
      } text-xs font-semibold`}>
        <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={portalUrl('/')}
            className={`inline-flex items-center gap-2 transition-colors ${
              isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : 'hover:text-white'
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
                  isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : 'hover:text-white'
                }`}
              >
                <UserRound className="size-3.5" /> <span>{account.data.email || 'Tài khoản'}</span>
              </Link>
            ) : (
              <Link
                href={loginUrl}
                className={`flex items-center gap-1.5 transition-colors ${
                  isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : 'hover:text-white'
                }`}
              >
                <UserRound className="size-3.5" /> <span>Tài khoản</span>
              </Link>
            )}
            <span className="opacity-30">|</span>
            <Link
              href={portalUrl('/support')}
              className={`transition-colors ${
                isLucDiaDamMe ? 'hover:text-[#152238]' : isThiTranMay ? 'hover:text-[#123b63]' : 'hover:text-white'
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
          : 'border-b border-black/5 bg-white/90 backdrop-blur-xl shadow-xs'
      }`}>
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href={gameUrl(game.subdomain, '/')} className="flex items-center gap-2.5">
              {isThiTranMay ? (
                <span className="text-xl sm:text-2xl font-black font-serif tracking-tight text-[#123b63]">
                  THỊ TRẤN MÂY
                </span>
              ) : isLucDiaDamMe ? (
                <span className="text-xl sm:text-2xl font-medium font-serif tracking-wide text-[#152238]">
                  LỤC ĐỊA ĐAM MÊ
                </span>
              ) : (
                <>
                  {game.iconUrl ? <img src={game.iconUrl} alt="" className="size-8 rounded-lg object-cover" /> : null}
                  <span className="text-base sm:text-lg font-black tracking-tight">{game.name}</span>
                  {game.recordType === 'DEMO' ? <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] uppercase tracking-wider">Demo</span> : null}
                </>
              )}
            </Link>
          </div>

          {/* Desktop Nav */}
          {isThiTranMay ? (
            <nav className="hidden items-center gap-8 text-sm font-bold text-[#123b63] md:flex">
              {thiTranMayNav.map(([href, label]) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => handleScroll(href)}
                  className="hover:text-[#118a94] transition-colors"
                >
                  {label}
                </button>
              ))}
              {routeEnabled('NEWS', 'ARTICLE_GRID') ? <Link href={gameUrl(game.subdomain, '/tin-tuc')} className="hover:text-[#118a94] transition-colors">Tin tức</Link> : null}
            </nav>
          ) : isLucDiaDamMe ? (
            <nav className="hidden items-center gap-10 text-sm font-medium text-[#152238] md:flex font-serif">
              {lucDiaDamMeNav.map(([href, label]) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => handleScroll(href)}
                  className="hover:text-[#9d7d47] transition-colors"
                >
                  {label}
                </button>
              ))}
            </nav>
          ) : (
            <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
              {standardNavItems.map(([href, label]) => (
                <Link key={href} href={gameUrl(game.subdomain, href)} className="hover:text-[var(--game-primary)]">
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right Header Action */}
          <div className="flex items-center gap-3">
            {isThiTranMay ? (
              <button
                type="button"
                onClick={() => handleScroll('#y-tuong')}
                className="hidden sm:inline-flex min-h-10 items-center justify-center rounded-full border-2 border-[#118a94] bg-white px-6 text-sm font-bold text-[#118a94] hover:bg-[#118a94]/10 transition-colors shadow-xs"
              >
                Khám phá concept
              </button>
            ) : isLucDiaDamMe ? (
              <Link
                href={gameUrl(game.subdomain, '/tai-game')}
                className="hidden sm:inline-flex min-h-10 items-center justify-center rounded-lg border border-[#c6aa73] bg-[#fbf7ee] px-6 text-xs font-semibold text-[#2a2115] hover:bg-[#f5eedc] transition-colors shadow-xs"
              >
                Tải game
              </Link>
            ) : (
              <>
                {account.data ? <Link href={portalUrl('/payment')} className="hidden items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold sm:inline-flex"><Coins className="size-3.5" /> {formatAmount(wallet.data?.balance ?? 0)} Coin</Link> : null}
                {account.data ? <Link href={portalUrl('/account')} className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-black/5" aria-label="Tài khoản">{mediaUrl(account.data.profile?.avatarUrl) ? <img src={mediaUrl(account.data.profile.avatarUrl)} alt="" className="size-full object-cover" /> : <UserRound className="size-4" />}</Link> : <Link href={loginUrl} className="hidden min-h-10 items-center gap-2 rounded-full bg-[var(--game-primary)] px-4 text-xs font-bold text-white sm:inline-flex"><LogIn className="size-3.5" /> Đăng nhập</Link>}
              </>
            )}
            <button type="button" className="flex size-10 items-center justify-center rounded-xl border border-black/10 md:hidden text-[#12243d]" onClick={() => setOpen((value) => !value)} aria-label="Mở menu">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>
          </div>
        </div>

        {/* Mobile Nav */}
        {open ? (
          <nav className="border-t border-black/10 bg-white px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold">
              {isThiTranMay
                ? thiTranMayNav.map(([href, label]) => (
                    <button
                      key={href}
                      type="button"
                      onClick={() => handleScroll(href)}
                      className="text-left rounded-lg px-3 py-3 hover:bg-black/5 text-[#123b63]"
                    >
                      {label}
                    </button>
                  ))
                : isLucDiaDamMe
                ? lucDiaDamMeNav.map(([href, label]) => (
                    <button
                      key={href}
                      type="button"
                      onClick={() => handleScroll(href)}
                      className="text-left rounded-lg px-3 py-3 hover:bg-black/5 text-[#12243d]"
                    >
                      {label}
                    </button>
                  ))
                : standardNavItems.map(([href, label]) => (
                    <Link key={href} href={gameUrl(game.subdomain, href)} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 hover:bg-black/5">
                      {label}
                    </Link>
                  ))}
            </div>
          </nav>
        ) : null}
      </header>

      {game.operationalStatus !== 'AVAILABLE' ? <div className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{game.operationalStatus === 'MAINTENANCE' ? 'Website đang bảo trì.' : game.operationalStatus === 'DEGRADED' ? 'Một số tính năng có thể tạm thời không ổn định.' : 'Game hiện chưa khả dụng.'}</div> : null}

      <main>{children}</main>

      {/* Footer */}
      {isThiTranMay ? (
        <footer className="border-t border-slate-900 bg-[#0c1c2e] text-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight text-white">{game.name}</h3>
              <p className="mt-1 text-xs text-slate-400">Game concept trong bộ thiết kế ZENX GO</p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
              <Link href={portalUrl('/games')} className="hover:text-white transition-colors">Game Hub</Link>
              <span className="opacity-20">|</span>
              <Link href={portalUrl('/support')} className="hover:text-white transition-colors">Hỗ trợ</Link>
              <span className="opacity-20">|</span>
              <Link href={portalUrl('/terms')} className="hover:text-white transition-colors">Điều khoản</Link>
              <span className="opacity-20">|</span>
              <Link href={portalUrl('/privacy')} className="hover:text-white transition-colors">Bảo mật</Link>
            </div>
          </div>
          <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
            <p>© {new Date().getFullYear()} ZENX GO</p>
            <p>Bản thiết kế minh họa — chưa phát hành.</p>
          </div>
        </footer>
      ) : isLucDiaDamMe ? (
        <footer className="border-t border-amber-500/20 bg-[#0c1b2c] text-white px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white font-serif">{game.name}</h3>
              <p className="mt-1 text-xs text-[#c6a365] flex items-center gap-1.5 font-medium">
                <span>✦</span> Một dự án của DAMMe Interactive <span>→</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
              <Link href={portalUrl('/games')} className="hover:text-white transition-colors">Về Game Hub</Link>
              <span className="opacity-20">|</span>
              <Link href={portalUrl('/support')} className="hover:text-white transition-colors">Hỗ trợ</Link>
              <span className="opacity-20">|</span>
              <Link href={portalUrl('/terms')} className="hover:text-white transition-colors">Điều khoản</Link>
              <span className="opacity-20">|</span>
              <Link href={portalUrl('/privacy')} className="hover:text-white transition-colors">Bảo mật</Link>
            </div>
          </div>
          <div className="mx-auto max-w-7xl mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
            <p>© 2026</p>
          </div>
        </footer>
      ) : (
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
      )}
    </div>
  );
}
