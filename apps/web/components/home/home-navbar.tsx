'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  Coins,
  Menu,
  UserRound,
  X
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { ZenxCoinGoldIcon } from '@/components/icons';
import { useAccount } from '@/hooks/use-account';
import { useWallet } from '@/hooks/use-wallet';
import { formatAmount, mediaUrl } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/games', label: 'Trò chơi' },
  { href: '/news', label: 'Tin tức' },
  { href: '/events', label: 'Sự kiện' },
  { href: '/community', label: 'Cộng đồng' },
  { href: '/rewards', label: 'Ưu đãi' },
  { href: '/support', label: 'Hỗ trợ' },
];

export function HomeNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [coinDropdownOpen, setCoinDropdownOpen] = useState(false);
  const pathname = usePathname();
  const account = useAccount();
  const wallet = useWallet({ enabled: Boolean(account.data) });
  const user = account.data;

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex min-h-[76px] sm:min-h-[80px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6 lg:gap-8">
          <BrandLogo href="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-1 lg:gap-1.5 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-xs lg:text-sm font-bold transition-colors ${
                    active
                      ? 'text-[#00873E] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-[#00873E]'
                      : 'text-slate-600 hover:text-[#00873E]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="hidden items-center gap-3.5 md:flex">
          {/* Coin Badge / Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCoinDropdownOpen(!coinDropdownOpen)}
              onBlur={() => setTimeout(() => setCoinDropdownOpen(false), 200)}
              className="flex items-center gap-2 rounded-full border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/70 px-4 py-2 text-xs font-bold text-amber-900 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer"
            >
              <ZenxCoinGoldIcon className="size-5 shrink-0" />
              <span>ZENX Coin</span>
              <ChevronDown className={`size-3.5 text-amber-700/80 transition-transform duration-200 ${coinDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {coinDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                  <span className="text-xs font-medium text-slate-500">Số dư khả dụng</span>
                  <span className="text-xs font-extrabold text-[#00873E]">
                    {user ? `${formatAmount(wallet.data?.balance ?? 0)} Coin` : 'Chưa đăng nhập'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 mb-3">
                  ZENX Coin là đơn vị thanh toán thống nhất trong toàn bộ hệ sinh thái game ZENX GO.
                </p>
                <Button asChild size="sm" className="w-full h-9 text-xs font-bold rounded-xl gap-1.5">
                  <Link href="/payment">
                    <Coins className="size-3.5" /> Nạp Coin ngay
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Auth State */}
          {user ? (
            <Link
              href="/account"
              className="flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white p-1.5 pr-4 hover:border-[#00873E]/40 hover:bg-emerald-50/30 transition-all text-left shadow-2xs group"
            >
              {/* Fixed Avatar Container */}
              <div className="relative shrink-0">
                <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#00873E]/20 bg-[#E8F7EC] text-[#00873E]">
                  {mediaUrl(user?.profile?.avatarUrl) ? (
                    <img
                      src={mediaUrl(user?.profile?.avatarUrl)}
                      alt={user?.profile?.fullName || user?.username || 'Avatar'}
                      className="size-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <UserRound className="size-4" />
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>

              {/* Name Display */}
              <div className="min-w-0 max-w-[130px]">
                <span className="block text-xs font-bold text-slate-800 truncate group-hover:text-[#00873E] transition-colors leading-tight">
                  {user?.profile?.fullName || user?.username || 'Zenxer'}
                </span>
                <span className="block text-[10px] text-slate-400 truncate leading-none mt-0.5">
                  {user?.username ? `@${user.username}` : 'Tài khoản'}
                </span>
              </div>

              <ArrowRight className="size-3.5 text-slate-400 group-hover:text-[#00873E] group-hover:translate-x-0.5 transition-all ml-0.5 shrink-0" />
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Login Button */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900"
              >
                <Link href="/auth/login">
                  <UserRound className="size-3.5 text-slate-500" />
                  <span>Đăng nhập</span>
                </Link>
              </Button>

              {/* Register Button */}
              <Button
                asChild
                size="sm"
                className="h-10 rounded-xl bg-[#00873E] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#007033] active:scale-98 transition-all"
              >
                <Link href="/auth/register">Tạo tài khoản</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link
              href="/account"
              className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-[#00873E] border border-emerald-300"
            >
              {mediaUrl(user?.profile?.avatarUrl) ? (
                <img
                  src={mediaUrl(user?.profile?.avatarUrl)}
                  alt="Avatar"
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <UserRound className="size-4.5" />
              )}
            </Link>
          ) : (
            <Button asChild size="sm" className="h-9 rounded-xl text-xs font-bold px-3.5">
              <Link href="/auth/login">Đăng nhập</Link>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 md:hidden animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <nav className="flex flex-col gap-1 pb-3">
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                    active
                      ? 'bg-emerald-50 text-[#00873E]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="size-1.5 rounded-full bg-[#00873E]" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <ZenxCoinGoldIcon className="size-5" />
                <span className="text-xs font-bold text-slate-800">ZENX Coin</span>
              </div>
              <span className="text-xs font-extrabold text-[#00873E]">
                {user ? `${formatAmount(wallet.data?.balance ?? 0)} Coin` : '0 Coin'}
              </span>
            </div>

            {user ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-10">
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                    Tài khoản
                  </Link>
                </Button>
                <Button asChild size="sm" className="rounded-xl text-xs font-semibold h-10">
                  <Link href="/payment" onClick={() => setMobileMenuOpen(false)}>
                    Nạp Coin
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-10">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                </Button>
                <Button asChild size="sm" className="rounded-xl text-xs font-semibold h-10">
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    Tạo tài khoản
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
