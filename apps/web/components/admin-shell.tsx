'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ShieldCheck,
  Users,
  X,
  FileText,
  ExternalLink,
  ChevronRight,
  Gamepad2,
  CalendarDays,
  Megaphone,
  Layers,
} from 'lucide-react';
import { useAdminMe } from '@/hooks/use-admin';
import { useSupportAdminDashboard } from '@/hooks/use-support';
import { ApiError } from '@zenx-go/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { getErrorMessage } from '@/lib/errors';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  hasBadge?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const allNavSections: NavSection[] = [
  {
    title: 'Hệ thống',
    items: [
      { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
      { href: '/admin/users', label: 'Người dùng', icon: Users },
    ],
  },
  {
    title: 'Nội dung & Game',
    items: [
      { href: '/admin/content', label: 'Tổng quan CMS', icon: Layers, exact: true },
      { href: '/admin/content/games', label: 'Quản lý Game', icon: Gamepad2 },
      { href: '/admin/content/articles', label: 'Bài viết & Tin tức', icon: FileText },
      { href: '/admin/content/events', label: 'Sự kiện Game', icon: CalendarDays },
      { href: '/admin/content/announcements', label: 'Thông báo Portal', icon: Megaphone },
    ],
  },
  {
    title: 'Vận hành & Bảo mật',
    items: [
      { href: '/admin/support', label: 'Hỗ trợ khách hàng', icon: LifeBuoy, hasBadge: true },
    ],
  },
];

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const admin = useAdminMe();
  const isSuperAdmin = admin.data?.roles.includes('SUPER_ADMIN') ?? false;
  const navSections: NavSection[] = isSuperAdmin
    ? allNavSections
    : [
        {
          title: 'Vận hành & Hỗ trợ',
          items: [
            { href: '/admin/support', label: 'Hỗ trợ khách hàng', icon: LifeBuoy, hasBadge: true },
          ],
        },
      ];

  const allItems = navSections.flatMap((s) => s.items);

  const supportDashboard = useSupportAdminDashboard(
    Boolean(admin.data && (isSuperAdmin || admin.data.roles.includes('SUPPORT'))),
  );
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: api.auth.logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace('/auth/login');
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  useEffect(() => {
    if (!(admin.error instanceof ApiError)) return;
    if (admin.error.status === 401) {
      const returnTo = `${pathname}${window.location.search}`;
      router.replace(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [admin.error, pathname, router]);

  useEffect(() => {
    if (admin.data && !isSuperAdmin && pathname === '/admin') router.replace('/admin/support');
  }, [admin.data, isSuperAdmin, pathname, router]);

  useEffect(() => {
    if (admin.data && !isSuperAdmin && pathname.startsWith('/admin/content')) {
      router.replace('/admin/support');
    }
  }, [admin.data, isSuperAdmin, pathname, router]);

  if (admin.isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Skeleton className="mx-auto h-[calc(100vh-3rem)] max-w-7xl rounded-3xl" />
      </div>
    );
  }

  if (admin.error instanceof ApiError && admin.error.code === 'ADMIN_ACCESS_REQUIRED') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto size-12 text-amber-500" />
          <h1 className="mt-4 text-xl font-black text-slate-900">Không có quyền truy cập</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Tài khoản của bạn chưa được cấp quyền quản trị ZENX GO.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.replace('/')}>
              Về trang chủ
            </Button>
            <Button variant="ghost" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Đăng xuất
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (admin.isError || !admin.data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm text-slate-500">
        {getErrorMessage(admin.error, 'Không thể tải khu vực quản trị.')}
      </main>
    );
  }

  const currentItem = allItems.find((item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/'),
  );

  const adminName = admin.data.profile?.fullName || admin.data.username;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {open ? (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[268px] -translate-x-full flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:translate-x-0',
          open && 'translate-x-0',
        )}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6 shrink-0">
          <Link
            href="/admin"
            className="group flex items-center gap-3 font-black tracking-tight text-slate-900"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#007234] to-[#00873E] text-white shadow-xs shadow-[#00873E]/20 transition group-hover:scale-105">
              <ShieldCheck className="size-5" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-base font-black">
                ZENX <span className="text-[#00873E]">GO</span>
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                Command Hub
              </span>
            </div>
          </Link>
          <button
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Đóng menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-[#E8F7EC] font-bold text-[#00873E] shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4.5 shrink-0 transition-colors',
                        active ? 'text-[#00873E]' : 'text-slate-400 group-hover:text-slate-700',
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hasBadge && supportDashboard.data?.tickets.unread ? (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        <span className="size-1.5 rounded-full bg-red-600 animate-pulse" />
                        {supportDashboard.data.tickets.unread}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-xs border border-slate-100">
            <UserAvatar
              id={admin.data.id}
              name={adminName}
              username={admin.data.username}
              email={admin.data.email}
              avatarUrl={admin.data.profile?.avatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">{adminName}</p>
              <p className="truncate text-[10px] text-slate-400">@{admin.data.username}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start gap-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="size-3.5" />
            {logout.isPending ? 'Đang thoát…' : 'Đăng xuất'}
          </Button>
        </div>
      </aside>

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Mở menu điều hướng"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <div className="hidden items-center gap-1.5 text-xs text-slate-400 sm:flex">
                <span>Quản trị ZENX</span>
                <ChevronRight className="size-3" />
                <span className="font-semibold text-slate-600">{currentItem?.label ?? 'Admin'}</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 sm:mt-0.5">
                {currentItem?.label ?? 'Admin Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:border-[#00873E]/40 hover:bg-[#E8F7EC]/30 hover:text-[#00873E] md:inline-flex"
            >
              <span>Xem trang chủ</span>
              <ExternalLink className="size-3" />
            </Link>

            <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-[#E8F7EC] px-3 py-1.5 text-xs font-bold text-[#00873E] shadow-2xs">
              <span className="size-2 rounded-full bg-[#00873E] animate-pulse" />
              <span>{admin.data.roles.join(' · ')}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
