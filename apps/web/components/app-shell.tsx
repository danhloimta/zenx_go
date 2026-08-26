'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronDown,
  CircleHelp,
  Clock3,
  Coins,
  Globe2,
  Home,
  KeyRound,
  Link2,
  Mail,
  MessageCircle,
  Menu,
  Phone,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { PageFooter } from '@/components/page-footer';
import { LogoutButton } from '@/components/logout-button';
import { useAccount } from '@/hooks/use-account';
import { cn, mediaUrl } from '@/lib/utils';
import { ApiError } from '@zenx-go/api-client';

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
  const account = useAccount();
  const user = account.data;

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {open ? (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
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
        <div className="flex h-[80px] items-center justify-between border-b border-slate-100 px-6">
          <BrandLogo />
          <button
            className="lg:hidden text-slate-500 hover:text-slate-900"
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
                          ? 'bg-[#E8F7EC] font-semibold text-[#00873E]'
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

        {/* Support box */}
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
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-slate-100 lg:hidden text-slate-700"
              onClick={() => setOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="size-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
              {pageTitle(pathname)}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled
              title="Thông báo sẽ được cập nhật sau"
              className="size-9 items-center justify-center rounded-full text-slate-400 hidden sm:inline-flex disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Thông báo"
            >
              <Bell className="size-5" />
            </button>
            <button
              disabled
              title="Ngôn ngữ sẽ được cập nhật sau"
              className="size-9 items-center justify-center rounded-full text-slate-400 hidden sm:inline-flex disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Ngôn ngữ"
            >
              <Globe2 className="size-5" />
            </button>
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />

            {/* User Profile Pill */}
            <Link href="/account" aria-label="Mở tài khoản" className="flex items-center gap-3 pl-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00873E]/20">
              <div className="flex size-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-slate-100 bg-[#E8F7EC] text-[#00873E]">
                {mediaUrl(user?.profile.avatarUrl) ? (
                  <img
                    src={mediaUrl(user?.profile.avatarUrl)}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-5" />
                )}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.profile.fullName || user?.username || 'Tài khoản'}
                </p>
                <p className="text-xs text-slate-400 leading-tight mt-0.5">
                  ID: {user?.id ? user.id.slice(0, 10) : '—'}
                </p>
              </div>
              <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
            </Link>

            <div className="hidden sm:block ml-2">
              <LogoutButton />
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-140px)] px-4 py-6 sm:px-8 lg:px-9">
          {children}
        </main>
        <PageFooter app />
      </div>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname === '/account') return 'Tổng quan';
  if (pathname.startsWith('/payment')) return 'Nạp Coin';
  if (pathname.startsWith('/wallet/transactions')) return 'Lịch sử giao dịch';
  if (pathname.startsWith('/wallet')) return 'Số dư';
  if (pathname.startsWith('/account/support')) return 'Yêu cầu hỗ trợ';
  if (pathname.includes('change-password')) return 'Đổi mật khẩu';
  if (pathname.includes('social')) return 'Liên kết tài khoản';
  if (pathname.includes('security')) return 'Bảo mật';
  if (pathname.includes('profile')) return 'Thông tin cá nhân';
  return 'Tổng quan';
}
