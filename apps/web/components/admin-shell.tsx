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
  ScrollText,
} from 'lucide-react';
import { useAdminMe } from '@/hooks/use-admin';
import { useSupportAdminDashboard } from '@/hooks/use-support';
import { ApiError } from '@zenx-go/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/errors';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const allItems = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/support', label: 'Hỗ trợ', icon: LifeBuoy },
  { href: '/admin/audit-logs', label: 'Nhật ký hoạt động', icon: ScrollText },
];

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const admin = useAdminMe();
  const isSuperAdmin = admin.data?.roles.includes('SUPER_ADMIN') ?? false;
  const items = isSuperAdmin ? allItems : allItems.filter((item) => item.href === '/admin/support');
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      {open ? (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[260px] -translate-x-full flex-col border-r border-slate-100 bg-white transition-transform lg:translate-x-0',
          open && 'translate-x-0',
        )}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 font-black tracking-tight text-slate-900"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#00873E] text-white">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              ZENX <span className="text-[#00873E]">ADMIN</span>
            </span>
          </Link>
          <button
            className="p-1 text-slate-500 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Quản trị hệ thống
          </p>
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-[#E8F7EC] font-bold text-[#00873E]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                )}
              >
                <Icon className="size-5" />
                <span>{item.label}</span>
                {item.href === '/admin/support' && supportDashboard.data?.tickets.unread ? (
                  <span className="ml-auto rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    {supportDashboard.data.tickets.unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="truncate px-2 text-xs font-semibold text-slate-800">
            {admin.data.profile?.fullName || admin.data.username}
          </p>
          <p className="truncate px-2 pt-1 text-[11px] text-slate-400">{admin.data.email}</p>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start gap-2 text-xs text-slate-600 hover:text-red-600"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="size-4" />
            {logout.isPending ? 'Đang thoát…' : 'Đăng xuất'}
          </Button>
        </div>
      </aside>
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              className="inline-flex size-10 items-center justify-center rounded-xl hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Mở menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="hidden text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                Khu vực quản trị
              </p>
              <h1 className="text-lg font-black">
                {items.find((item) =>
                  item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href),
                )?.label ?? 'Admin'}
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-[#00873E] sm:flex">
            <ShieldCheck className="size-4" /> {admin.data.roles.join(' · ')}
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
