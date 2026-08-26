'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Coins,
  Globe2,
  Home,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { PageFooter } from '@/components/page-footer';
import { LogoutButton } from '@/components/logout-button';
import { useAccount } from '@/hooks/use-account';
import { useWallet } from '@/hooks/use-wallet';
import { cn, formatAmount, mediaUrl } from '@/lib/utils';
import { ApiError } from '@zenx-go/api-client';
import { toast } from 'sonner';

const groups = [
  { title: null, items: [{ href: '/account', label: 'Tổng quan', icon: Home }] },
  {
    title: 'TÀI KHOẢN',
    items: [
      { href: '/account/profile', label: 'Thông tin cá nhân', icon: UserRound },
      { href: '/account/security', label: 'Bảo mật', icon: ShieldCheck },
      { href: '/account/change-password', label: 'Đổi mật khẩu', icon: KeyRound },
      { href: '/account/social', label: 'Liên kết tài khoản', icon: Link2 },
    ],
  },
  {
    title: 'VÍ ZENX',
    items: [
      { href: '/wallet', label: 'Số dư', icon: WalletCards },
      { href: '/payment', label: 'Nạp Coin', icon: Coins },
      { href: '/wallet/transactions', label: 'Lịch sử giao dịch', icon: Clock3 },
    ],
  },
  {
    title: 'HỖ TRỢ',
    items: [
      { href: '/support', label: 'Trung tâm hỗ trợ', icon: CircleHelp },
      { href: '/account/support', label: 'Yêu cầu của tôi', icon: MessageCircle },
    ],
  },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const onboardingNoticeShown = useRef(false);

  const account = useAccount();
  const wallet = useWallet();
  const user = account.data;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns and drawer on route change
  useEffect(() => {
    setUserDropdownOpen(false);
    setNotifDropdownOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (account.error instanceof ApiError && account.error.status === 401) {
      const next = `${pathname}${window.location.search}`;
      router.replace(`/auth/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (
      user &&
      user.profile.profileCompletedAt === null &&
      pathname !== '/account/complete-profile'
    ) {
      if (!onboardingNoticeShown.current) {
        onboardingNoticeShown.current = true;
        toast.info('Vui lòng hoàn thiện hồ sơ trước khi tiếp tục sử dụng các màn hình khác.');
      }
      router.replace('/account/complete-profile');
    }
  }, [account.error, pathname, router, user]);

  const isActive = (href: string) => {
    if (!href.startsWith('/')) return false;
    if (href === '/account') return pathname === '/account';
    if (href === '/wallet') return pathname === '/wallet';
    if (href === '/payment') return pathname.startsWith('/payment');
    if (href === '/wallet/transactions') return pathname.startsWith('/wallet/transactions');
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const pageMeta = getPageMeta(pathname);
  const PageIcon = pageMeta.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {open ? (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[260px] -translate-x-full flex-col border-r border-slate-100 bg-white transition-transform duration-200 lg:translate-x-0',
          open && 'translate-x-0',
        )}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <BrandLogo />
          <button
            className="lg:hidden text-slate-500 hover:text-slate-900 p-1"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {groups.map((group) => (
            <div key={group.title ?? 'overview'}>
              {group.title ? (
                <p className="mb-2 px-3 text-[11px] font-bold tracking-wider text-slate-400">
                  {group.title}
                </p>
              ) : null}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-[#E8F7EC] font-bold text-[#00873E]'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <Icon
                        className={cn('size-5 shrink-0', active ? 'text-[#00873E]' : 'text-slate-500')}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Support Box */}
        <div className="m-4 rounded-2xl border border-slate-100 bg-[#F9FCFA] p-4 text-xs" id="support">
          <p className="font-bold text-slate-900">Cần hỗ trợ?</p>
          <p className="mt-1 text-slate-500 leading-tight">Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
          <div className="mt-3.5 space-y-2">
            <a
              href="tel:19001234"
              className="flex items-center gap-2.5 font-semibold text-[#00873E] hover:underline"
            >
              <Phone className="size-3.5" />
              <span>1900 1234</span>
            </a>
            <a
              href="mailto:support@zenxgo.vn"
              className="flex items-center gap-2.5 text-slate-600 hover:text-[#00873E]"
            >
              <Mail className="size-3.5" />
              <span>support@zenxgo.vn</span>
            </a>
          </div>
        </div>

        <div className="m-4 mt-0 sm:hidden">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[260px]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur sm:px-8">
          {/* Left Title & Breadcrumbs */}
          <div className="flex min-w-0 items-center gap-3.5">
            <button
              className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-slate-100 lg:hidden text-slate-700 transition-colors"
              onClick={() => setOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="size-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex size-10 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E] shrink-0">
                <PageIcon className="size-5" />
              </div>
              <div>
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>{pageMeta.category}</span>
                  <span>/</span>
                  <span className="text-[#00873E] font-bold">{pageMeta.title}</span>
                </div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {pageMeta.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Controls & User Pill */}
          <div className="flex items-center gap-3">
            {/* Quick Wallet Coin Balance Pill */}
            <Link
              href="/payment"
              title="Xem số dư ví và nạp Coin"
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/80 hover:bg-emerald-100/90 px-3.5 py-1.5 transition-all text-xs font-bold text-[#00873E] shadow-2xs hover:shadow-sm"
            >
              <Coins className="size-4 text-[#00873E]" />
              <span>{formatAmount(wallet.data?.balance ?? 0)} Coin</span>
              <span className="rounded-full bg-[#00873E] text-white px-2 py-0.5 text-[10px] font-bold tracking-wide">
                + Nạp
              </span>
            </Link>

            {/* Notification Popover */}
            <div className="relative" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifDropdownOpen((v) => !v);
                  setUserDropdownOpen(false);
                }}
                className={cn(
                  'flex size-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors relative',
                  notifDropdownOpen && 'bg-slate-100 text-slate-900',
                )}
                aria-label="Thông báo"
                title="Thông báo hệ thống"
              >
                <Bell className="size-5" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-[#00873E] ring-2 ring-white" />
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Bell className="size-3.5 text-[#00873E]" /> Thông báo hệ thống
                    </p>
                    <span className="text-[10px] font-semibold text-slate-400">Mới nhất</span>
                  </div>
                  <div className="py-6 text-center">
                    <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                      <Bell className="size-5" />
                    </div>
                    <p className="mt-2.5 text-xs font-bold text-slate-800">Chưa có thông báo mới</p>
                    <p className="mt-1 text-[11px] text-slate-400 max-w-[200px] mx-auto">
                      Các cập nhật số dư, bảo mật và giao dịch sẽ hiển thị ở đây.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            {/* User Profile Pill & Interactive Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen((v) => !v);
                  setNotifDropdownOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2.5 rounded-full border border-slate-200/90 bg-white p-1 pr-3 hover:border-slate-300 hover:bg-slate-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-[#00873E]/20',
                  userDropdownOpen && 'border-[#00873E]/40 ring-2 ring-[#00873E]/10 bg-slate-50',
                )}
                aria-expanded={userDropdownOpen}
                aria-label="Menu tài khoản"
              >
                {/* Avatar with Status Dot */}
                <div className="relative shrink-0">
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-[#00873E]/20 bg-[#E8F7EC] text-[#00873E]">
                    {mediaUrl(user?.profile?.avatarUrl) ? (
                      <img
                        src={mediaUrl(user?.profile?.avatarUrl)}
                        alt={user?.profile?.fullName || user?.username || 'Avatar'}
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound className="size-4" />
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                {/* Name & Username */}
                <div className="hidden sm:block min-w-0 max-w-[130px]">
                  <p className="text-xs font-bold text-slate-900 truncate leading-snug">
                    {user?.profile?.fullName || user?.username || 'Tài khoản'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate leading-none">
                    @{user?.username || 'user'}
                  </p>
                </div>

                <ChevronDown
                  className={cn(
                    'size-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-0.5',
                    userDropdownOpen && 'rotate-180 text-slate-700',
                  )}
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
                    <Link
                      href="/account/profile"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <UserRound className="size-4 text-slate-400" />
                      Thông tin cá nhân
                    </Link>
                    <Link
                      href="/account/security"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <ShieldCheck className="size-4 text-slate-400" />
                      Bảo mật tài khoản
                    </Link>
                    <Link
                      href="/payment"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <Coins className="size-4 text-[#00873E]" />
                      Nạp Coin
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <CircleHelp className="size-4 text-slate-400" />
                      Trung tâm hỗ trợ
                    </Link>
                  </div>

                  {/* Divider & Logout */}
                  <div className="my-1 border-t border-slate-100" />
                  <div className="pt-0.5">
                    <LogoutButton variant="ghost" className="w-full justify-start text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg px-3 py-2 h-auto" />
                  </div>
                </div>
              )}
            </div>

            {/* Direct Desktop Logout Button */}
            <div className="hidden xl:block">
              <LogoutButton />
            </div>
          </div>
        </header>

        {/* Main View Area */}
        <main className="min-h-[calc(100vh-140px)] px-4 py-6 sm:px-8 lg:px-9">
          {children}
        </main>
        <PageFooter app />
      </div>
    </div>
  );
}

function getPageMeta(pathname: string) {
  if (pathname === '/account') return { category: 'TỔNG QUAN', title: 'Tổng quan tài khoản', icon: Home };
  if (pathname.startsWith('/payment')) return { category: 'VÍ ZENX', title: 'Nạp Coin', icon: Coins };
  if (pathname.startsWith('/wallet/transactions')) return { category: 'VÍ ZENX', title: 'Lịch sử giao dịch', icon: Clock3 };
  if (pathname.startsWith('/wallet')) return { category: 'VÍ ZENX', title: 'Số dư ví', icon: WalletCards };
  if (pathname.startsWith('/account/support')) return { category: 'HỖ TRỢ', title: 'Yêu cầu của tôi', icon: MessageCircle };
  if (pathname.startsWith('/support')) return { category: 'HỖ TRỢ', title: 'Trung tâm hỗ trợ', icon: CircleHelp };
  if (pathname.includes('change-password')) return { category: 'TÀI KHOẢN', title: 'Đổi mật khẩu', icon: KeyRound };
  if (pathname.includes('social')) return { category: 'TÀI KHOẢN', title: 'Liên kết tài khoản', icon: Link2 };
  if (pathname.includes('security')) return { category: 'TÀI KHOẢN', title: 'Bảo mật', icon: ShieldCheck };
  if (pathname.includes('profile')) return { category: 'TÀI KHOẢN', title: 'Thông tin cá nhân', icon: UserRound };
  return { category: 'TÀI KHOẢN', title: 'Tài khoản ZENX', icon: Home };
}
