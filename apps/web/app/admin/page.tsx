'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  Users,
  RefreshCw,
  Search,
  FileText,
  LifeBuoy,
  Gamepad2,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useAdminDashboard, useAdminMe } from '@/hooks/use-admin';
import { useSupportAdminDashboard } from '@/hooks/use-support';
import { useAdminContentDashboard } from '@/hooks/use-content';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { AccountStatusBadge } from '@/components/account-status-badge';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { AdminUserSummary } from '@zenx-go/api-client';

export default function AdminDashboardPage() {
  const admin = useAdminMe();
  const router = useRouter();
  const isSuperAdmin = admin.data?.roles.includes('SUPER_ADMIN') ?? false;
  const dashboard = useAdminDashboard(Boolean(admin.data && isSuperAdmin));
  const supportDashboard = useSupportAdminDashboard(Boolean(admin.data && isSuperAdmin));
  const contentDashboard = useAdminContentDashboard(Boolean(admin.data && isSuperAdmin));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (admin.data && !isSuperAdmin) router.replace('/admin/support');
  }, [admin.data, isSuperAdmin, router]);

  if (admin.data && !isSuperAdmin) return null;
  if (dashboard.isLoading) return <DashboardSkeleton />;

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 text-sm text-red-700 shadow-xs">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-5 shrink-0 text-red-600" />
          <p className="font-semibold">Không thể tải dữ liệu tổng quan quản trị.</p>
        </div>
        <p className="mt-2 text-xs text-red-600">
          Vui lòng kiểm tra kết nối API hoặc quyền hạn của tài khoản và thử lại.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 border-red-200 bg-white text-red-700 hover:bg-red-50"
          onClick={() => dashboard.refetch()}
        >
          <RefreshCw className="mr-1.5 size-3.5" /> Thử lại
        </Button>
      </div>
    );
  }

  const data = dashboard.data;
  const users = data.users;
  const totalUsers = users.total || 0;
  const activeUsers = users.byStatus.ACTIVE ?? 0;
  const pendingUsers = users.byStatus.PENDING ?? 0;
  const lockedUsers = users.byStatus.LOCKED ?? 0;
  const suspendedUsers = users.byStatus.SUSPENDED ?? 0;

  const activePercent = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0';
  const pendingPercent = totalUsers > 0 ? ((pendingUsers / totalUsers) * 100).toFixed(1) : '0';
  const lockedPercent = totalUsers > 0 ? ((lockedUsers / totalUsers) * 100).toFixed(1) : '0';
  const suspendedPercent =
    totalUsers > 0 ? ((suspendedUsers / totalUsers) * 100).toFixed(1) : '0';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dashboard.refetch(),
        supportDashboard.refetch(),
        contentDashboard.refetch(),
      ]);
      startTransition(() => {
        toast.success('Đã cập nhật dữ liệu tổng quan mới nhất');
      });
    } catch {
      toast.error('Lỗi khi làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  const currentDateFormatted = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-7">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Tổng quan vận hành ZENX GO
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-[#E8F7EC] px-2 py-0.5 text-[10px] font-bold text-[#00873E]">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Xin chào <span className="font-semibold text-slate-800">{admin.data?.profile?.fullName || admin.data?.username}</span> · {currentDateFormatted}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing || dashboard.isFetching ? 'animate-spin text-[#00873E]' : ''}`}
            />
            <span>{isRefreshing ? 'Đang cập nhật…' : 'Làm mới'}</span>
          </Button>

          <Button asChild size="sm" className="h-8 text-xs gap-1.5 font-semibold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs">
            <Link href="/admin/users">
              <Users className="size-3.5" />
              <span>Quản lý người dùng</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Link
          href="/admin/users"
          className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs sm:p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
            <Search className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
              Tìm người dùng
            </p>
            <p className="truncate text-[11px] text-slate-400">Tra cứu & xử lý tài khoản</p>
          </div>
        </Link>

        <Link
          href="/admin/content/articles/new"
          className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs sm:p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E] transition group-hover:scale-105 group-hover:bg-[#00873E] group-hover:text-white">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
              Viết bài mới
            </p>
            <p className="truncate text-[11px] text-slate-400">Soạn tin tức & cẩm nang</p>
          </div>
        </Link>

        <Link
          href="/admin/support"
          className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs sm:p-4"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white">
            <LifeBuoy className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
              Xử lý hỗ trợ
            </p>
            <p className="truncate text-[11px] text-slate-400">Ticket & phản hồi người chơi</p>
          </div>
        </Link>

      </div>

      {/* Primary 4 KPI Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Tổng người dùng */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-150 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Tổng người dùng
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {totalUsers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-[#00873E] ring-1 ring-emerald-200/60">
              <Users className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#00873E]">
              <TrendingUp className="size-3" />
              +{users.registeredLast7Days}
            </span>
            <span className="text-xs text-slate-500">đăng ký 7 ngày qua</span>
          </div>
        </div>

        {/* Card 2: Đang hoạt động */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-150 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Đang hoạt động
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {activeUsers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-600 ring-1 ring-teal-200/60">
              <CheckCircle2 className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">
              <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
              {activePercent}%
            </span>
            <span className="text-xs text-slate-500">tổng số tài khoản</span>
          </div>
        </div>

        {/* Card 3: Chờ duyệt & Chú ý */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-150 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Chờ duyệt & Cần chú ý
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {(pendingUsers + lockedUsers).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 ring-1 ring-amber-200/60">
              <Clock3 className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              <strong className="text-amber-700">{pendingUsers}</strong> chờ duyệt ·{' '}
              <strong className="text-rose-700">{lockedUsers}</strong> bị khóa
            </span>
            <Link
              href="/admin/users"
              className="inline-flex items-center text-xs font-bold text-amber-600 hover:underline"
            >
              Lọc ngay <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Card 4: Tạm ngưng */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-150 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Tài khoản tạm ngưng
              </p>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                {suspendedUsers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 text-slate-700 ring-1 ring-slate-300/60">
              <Ban className="size-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">{suspendedPercent}% tổng tài khoản</span>
            <Link
              href="/admin/users"
              className="inline-flex items-center text-xs font-bold text-slate-600 hover:underline"
            >
              Kiểm tra <ChevronRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Account Status Distribution Strip */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-900 sm:text-base">
              Phân bổ trạng thái tài khoản
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Tỷ lệ phân bố tình trạng người dùng trong toàn hệ thống
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Tổng cộng: {totalUsers.toLocaleString('vi-VN')} tài khoản
          </span>
        </div>

        {/* Segmented Progress Bar */}
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
          {activeUsers > 0 && (
            <div
              style={{ width: `${activePercent}%` }}
              className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
              title={`Hoạt động: ${activeUsers} (${activePercent}%)`}
            />
          )}
          {pendingUsers > 0 && (
            <div
              style={{ width: `${pendingPercent}%` }}
              className="h-full bg-amber-400 transition-all duration-500"
              title={`Chờ duyệt: ${pendingUsers} (${pendingPercent}%)`}
            />
          )}
          {suspendedUsers > 0 && (
            <div
              style={{ width: `${suspendedPercent}%` }}
              className="h-full bg-slate-400 transition-all duration-500"
              title={`Tạm ngưng: ${suspendedUsers} (${suspendedPercent}%)`}
            />
          )}
          {lockedUsers > 0 && (
            <div
              style={{ width: `${lockedPercent}%` }}
              className="h-full rounded-r-full bg-rose-500 transition-all duration-500"
              title={`Bị khóa: ${lockedUsers} (${lockedPercent}%)`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50/60 p-2.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">Đang hoạt động</p>
              <p className="text-xs font-bold text-slate-900">
                {activeUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({activePercent}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50/60 p-2.5">
            <span className="size-2.5 rounded-full bg-amber-400" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">Chờ xác minh</p>
              <p className="text-xs font-bold text-slate-900">
                {pendingUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({pendingPercent}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50/60 p-2.5">
            <span className="size-2.5 rounded-full bg-slate-400" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">Tạm ngưng</p>
              <p className="text-xs font-bold text-slate-900">
                {suspendedUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({suspendedPercent}%)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50/60 p-2.5">
            <span className="size-2.5 rounded-full bg-rose-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500">Bị khóa</p>
              <p className="text-xs font-bold text-slate-900">
                {lockedUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({lockedPercent}%)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem Pulse: Support Hub & Content CMS Highlights */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Support Hub Quick Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <LifeBuoy className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Trung tâm Hỗ trợ Khách hàng</h3>
                <p className="text-xs text-slate-500">Tình trạng vé hỗ trợ người chơi</p>
              </div>
            </div>
            <Link
              href="/admin/support"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#00873E] hover:underline"
            >
              Mở Ticket Hub <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Chưa đọc</p>
              <p className="mt-1 text-lg font-black text-rose-600">
                {supportDashboard.data?.tickets.unread ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Chưa phân công</p>
              <p className="mt-1 text-lg font-black text-amber-600">
                {supportDashboard.data?.tickets.unassigned ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Mới tiếp nhận</p>
              <p className="mt-1 text-lg font-black text-blue-600">
                {supportDashboard.data?.tickets.byStatus.NEW ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Content CMS Quick Card */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Gamepad2 className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Quản lý Nội dung Portal</h3>
                <p className="text-xs text-slate-500">Games, bài viết & sự kiện</p>
              </div>
            </div>
            <Link
              href="/admin/content"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#00873E] hover:underline"
            >
              Mở Content CMS <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Game Portal</p>
              <p className="mt-1 text-lg font-black text-violet-700">
                {contentDashboard.data?.games.total ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Bài viết</p>
              <p className="mt-1 text-lg font-black text-emerald-600">
                {(contentDashboard.data?.articles.published ?? 0) +
                  (contentDashboard.data?.articles.draft ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
              <p className="text-[11px] font-semibold text-slate-500">Sự kiện</p>
              <p className="mt-1 text-lg font-black text-sky-600">
                {(contentDashboard.data?.events.active ?? 0) +
                  (contentDashboard.data?.events.upcoming ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Deep-Dive Sections */}
      <div className="grid gap-6">
        {/* Left Column: Người dùng mới */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 sm:text-base">Người dùng mới đăng ký</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  Top 10
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-slate-500">10 tài khoản mới gia nhập ZENX GO</p>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#00873E] hover:underline ml-3"
            >
              <span>Xem tất cả {totalUsers}</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentUsers.length ? (
              data.recentUsers.map((user) => <ModernUserRow key={user.id} user={user} />)
            ) : (
              <div className="p-12 text-center">
                <Users className="mx-auto size-10 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Chưa có người dùng</p>
                <p className="text-xs text-slate-400">Danh sách người dùng đăng ký sẽ hiển thị ở đây.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 p-3.5 text-center bg-slate-50/40 rounded-b-2xl">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#00873E]"
            >
              Mở danh sách quản lý người dùng đầy đủ <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}

function ModernUserRow({ user }: { user: AdminUserSummary }) {
  const fullName = user.profile?.fullName || user.username;

  return (
    <div className="group flex items-center justify-between gap-4 px-5 py-3.5 transition duration-150 hover:bg-slate-50/80 sm:px-6">
      <div className="flex min-w-0 items-center gap-3.5">
        <UserAvatar
          id={user.id}
          name={fullName}
          username={user.username}
          email={user.email}
          avatarUrl={user.profile?.avatarUrl}
          status={user.status}
          showStatusDot
          size="md"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/users/${user.id}`}
              className="truncate text-sm font-bold text-slate-900 group-hover:text-[#00873E] hover:underline"
            >
              {fullName}
            </Link>
            <AccountStatusBadge status={user.status} variant="dot" size="sm" className="sm:hidden" />
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            <span className="font-medium text-slate-700">@{user.username}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            <span>{user.email}</span>
            {user.phone ? (
              <>
                <span className="mx-1.5 text-slate-300">·</span>
                <span>{user.phone}</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <AccountStatusBadge
          status={user.status}
          variant="dot"
          size="sm"
          className="hidden sm:inline-flex"
        />
        <span className="text-[11px] font-medium text-slate-400">
          {formatDate(user.createdAt)}
        </span>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-[#00873E] hover:bg-[#E8F7EC]"
        >
          <Link href={`/admin/users/${user.id}`} aria-label={`Xem chi tiết ${user.username}`}>
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-36 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((v) => (
          <Skeleton key={v} className="h-16 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((v) => (
          <Skeleton key={v} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[480px] rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    </div>
  );
}
