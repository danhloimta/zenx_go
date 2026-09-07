'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  ChevronDown,
  CircleHelp,
  Coins,
  Menu,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/logout-button';
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
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const coinMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const account = useAccount();
  const wallet = useWallet({ enabled: Boolean(account.data) });
  const user = account.data;
  const isAdmin = Boolean(user?.roles && user.roles.length > 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (coinMenuRef.current && !coinMenuRef.current.contains(event.target as Node)) {
        setCoinDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-5 lg:px-6">
        {/* Left: Brand Logo & Desktop Navigation */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          <BrandLogo href="/" compact className="shrink-0" />

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center md:flex min-w-0">
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-2.5 lg:px-3 py-1.5 text-xs lg:text-[13px] font-bold whitespace-nowrap transition-colors ${
                    active
                      ? 'text-[#00873E] after:absolute after:bottom-0 after:left-2.5 after:right-2.5 lg:after:left-3 lg:after:right-3 after:h-0.5 after:rounded-full after:bg-[#00873E]'
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
        <div className="hidden items-center gap-2 lg:gap-2.5 md:flex shrink-0">
          {/* Guest Coin Info or Logged-in State */}
          {!user && (
            <div className="relative" ref={coinMenuRef}>
              <button
                type="button"
                onClick={() => setCoinDropdownOpen(!coinDropdownOpen)}
                className="flex items-center gap-1.5 h-8.5 px-3 rounded-full border border-amber-200/90 bg-gradient-to-r from-amber-50 to-orange-50/60 text-xs font-bold text-amber-900 shadow-2xs hover:border-amber-300 hover:bg-amber-100/70 transition-all cursor-pointer whitespace-nowrap"
              >
                <ZenxCoinGoldIcon className="size-4 shrink-0" />
                <span>ZENX Coin</span>
                <ChevronDown className={`size-3 text-amber-700/70 transition-transform duration-200 ${coinDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {coinDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-medium text-slate-500">Số dư khả dụng</span>
                    <span className="text-xs font-extrabold text-[#00873E]">Chưa đăng nhập</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-500 mb-2.5">
                    Đơn vị thanh toán dùng chung trong toàn bộ hệ sinh thái game ZENX GO.
                  </p>
                  <Button asChild size="sm" className="w-full h-8 text-xs font-bold rounded-xl gap-1.5">
                    <Link href="/auth/login">
                      <Coins className="size-3.5" /> Đăng nhập để xem số dư
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Auth State */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white py-1 pl-1 pr-2.5 hover:border-slate-300 hover:bg-slate-50 transition-all text-left shadow-2xs group whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00873E]/20"
                aria-expanded={userDropdownOpen}
              >
                {/* Fixed Avatar with explicit dimensions */}
                <div className="relative size-8 shrink-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1.5 ring-[#00873E]/25 bg-[#E8F7EC] text-[#00873E]">
                    {mediaUrl(user?.profile?.avatarUrl) ? (
                      <img
                        src={mediaUrl(user?.profile?.avatarUrl)}
                        alt={user?.profile?.fullName || user?.username || 'Avatar'}
                        className="h-full w-full rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <UserRound className="h-4 w-4" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                {/* Name */}
                <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate group-hover:text-[#00873E] transition-colors leading-none">
                  {user?.profile?.fullName || user?.username || 'Tài khoản'}
                </span>

                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    userDropdownOpen ? 'rotate-180 text-slate-700' : 'group-hover:text-slate-600'
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  {/* User Profile Header in Menu */}
                  <div className="rounded-xl bg-gradient-to-br from-slate-50 to-[#F0FAF2] p-3 border border-slate-100/80 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.profile?.fullName || user?.username}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user?.email || `@${user?.username}`}
                    </p>
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 font-medium">Số dư:</span>
                      <span className="font-bold text-[#00873E]">
                        {formatAmount(wallet.data?.balance ?? 0)} Coin
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Links */}
                  <div className="space-y-0.5">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-200/80 mb-1"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldAlert className="size-4 text-amber-600 shrink-0" />
                          Trang quản trị (Admin)
                        </span>
                        <span className="rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-900 uppercase">
                          {user?.roles?.includes('SUPER_ADMIN') ? 'Super Admin' : 'Staff'}
                        </span>
                      </Link>
                    )}
                    <Link
                      href="/account/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <UserRound className="size-4 text-slate-400" />
                      Thông tin cá nhân
                    </Link>
                    <Link
                      href="/account/security"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <ShieldCheck className="size-4 text-slate-400" />
                      Bảo mật tài khoản
                    </Link>
                    <Link
                      href="/payment"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Coins className="size-4 text-[#00873E]" />
                      Nạp Coin
                    </Link>
                    <Link
                      href="/support"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <CircleHelp className="size-4 text-slate-400" />
                      Trung tâm hỗ trợ
                    </Link>
                  </div>

                  {/* Divider & Logout */}
                  <div className="my-1 border-t border-slate-100" />
                  <div className="pt-0.5">
                    <LogoutButton
                      variant="ghost"
                      className="w-full justify-start text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg px-3 py-2 h-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8.5 px-3 text-xs font-semibold text-slate-700 hover:text-slate-900 whitespace-nowrap"
              >
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-8.5 px-3.5 rounded-xl bg-[#00873E] text-xs font-bold text-white shadow-xs hover:bg-[#007033] active:scale-98 transition-all whitespace-nowrap"
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
              <div className="flex flex-col gap-2 pt-1">
                {isAdmin && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl text-xs font-bold border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 h-10 gap-2"
                  >
                    <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <ShieldAlert className="size-4 text-amber-600" />
                      <span>Trang quản trị (Admin)</span>
                    </Link>
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
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
