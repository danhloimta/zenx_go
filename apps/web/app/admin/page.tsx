'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
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
  CreditCard,
  Coins,
  AlertTriangle,
  Receipt,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAdminDashboard, useAdminMe } from '@/hooks/use-admin';
import { useSupportAdminDashboard } from '@/hooks/use-support';
import { useAdminContentDashboard } from '@/hooks/use-content';
import { useAdminFinanceDashboard, useAdminFinancePayments } from '@/hooks/use-finance';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { AccountStatusBadge } from '@/components/account-status-badge';
import { formatAmount, formatDate, paymentMethodLabel } from '@/lib/utils';
import { toast } from 'sonner';
import type { AdminFinancePayment, AdminUserSummary } from '@zenx-go/api-client';
import { useAdminAbility } from '@/lib/admin-ability';

const paymentStatusBadge: Record<string, { label: string; className: string; dotClass: string }> = {
  CREATED: {
    label: 'Chờ thanh toán',
    className: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
  },
  PENDING: {
    label: 'Đang xử lý',
    className: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  SUCCESS: {
    label: 'Thành công',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  FAILED: {
    label: 'Thất bại',
    className: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
  EXPIRED: {
    label: 'Hết hạn',
    className: 'bg-slate-100 text-slate-600 border-slate-200/80',
    dotClass: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Đã hủy',
    className: 'bg-slate-100 text-slate-600 border-slate-200/80',
    dotClass: 'bg-slate-400',
  },
  REFUNDED: {
    label: 'Đã hoàn tiền',
    className: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dotClass: 'bg-purple-500',
  },
};

export default function AdminDashboardPage() {
  const admin = useAdminMe();
  const ability = useAdminAbility();
  const canViewDashboard = ability.can('read', 'Dashboard');
  const canViewFinance = ability.can('read', 'FinanceDashboard');
  const canViewPayments = ability.can('read', 'Payment');
  const canViewSupport = ability.can('read', 'SupportDashboard');
  const canViewContent = ability.can('read', 'ContentDashboard');
  const canViewUsers = ability.can('read', 'User');

  const dashboard = useAdminDashboard(Boolean(admin.data && canViewDashboard));
  const financeDashboard = useAdminFinanceDashboard(Boolean(admin.data && canViewFinance));
  const recentPaymentsQuery = useAdminFinancePayments(
    { page: 1, pageSize: 6 },
    Boolean(admin.data && canViewPayments),
  );
  const supportDashboard = useSupportAdminDashboard(Boolean(admin.data && canViewSupport));
  const contentDashboard = useAdminContentDashboard(Boolean(admin.data && canViewContent));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [, startTransition] = useTransition();

  if (admin.data && !canViewDashboard) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Tài khoản đã vào khu vực quản trị nhưng chưa được cấp quyền cho màn hình tổng quan này.
      </div>
    );
  }

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

  // Finance metrics
  const financeData = financeDashboard.data;
  const totalPayments = financeData?.payments.total ?? 0;
  const successPayments = financeData?.payments.byStatus.SUCCESS ?? 0;
  const pendingPayments =
    (financeData?.payments.byStatus.PENDING ?? 0) + (financeData?.payments.byStatus.CREATED ?? 0);
  const failedPayments = financeData?.payments.byStatus.FAILED ?? 0;
  const refundedPayments = financeData?.payments.byStatus.REFUNDED ?? 0;

  const paymentSuccessRate =
    totalPayments > 0 ? Math.round((successPayments / totalPayments) * 100) : 0;
  const paymentPendingRate =
    totalPayments > 0 ? Math.round((pendingPayments / totalPayments) * 100) : 0;
  const paymentFailedRate =
    totalPayments > 0 ? Math.round((failedPayments / totalPayments) * 100) : 0;
  const paymentRefundedRate =
    totalPayments > 0 ? Math.round((refundedPayments / totalPayments) * 100) : 0;

  // Support metrics
  const supportData = supportDashboard.data;
  const unreadTickets = supportData?.tickets.unread ?? 0;
  const unassignedTickets = supportData?.tickets.unassigned ?? 0;
  const newTickets = supportData?.tickets.byStatus.NEW ?? 0;
  const attentionTickets = unreadTickets + unassignedTickets + newTickets;

  // Content metrics
  const contentData = contentDashboard.data;

  // Operational Action Items
  const oldestPendingPayment = financeData?.payments.oldestPending;
  const hasActionItems =
    Boolean(oldestPendingPayment) ||
    attentionTickets > 0 ||
    pendingUsers > 0 ||
    lockedUsers > 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        dashboard.refetch(),
        canViewFinance ? financeDashboard.refetch() : Promise.resolve(),
        canViewPayments ? recentPaymentsQuery.refetch() : Promise.resolve(),
        canViewSupport ? supportDashboard.refetch() : Promise.resolve(),
        canViewContent ? contentDashboard.refetch() : Promise.resolve(),
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

  const recentUsersList = data.recentUsers.slice(0, 6);
  const recentPaymentsList = recentPaymentsQuery.data?.items.slice(0, 6) ?? [];

  return (
    <div className="space-y-6 sm:space-y-7 pb-10">
      {/* 1. Executive Command Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Tổng quan Vận hành ZENX GO
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-[#00873E]">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Xin chào <strong className="text-slate-800">{admin.data?.profile?.fullName || admin.data?.username}</strong> · Hôm nay là {currentDateFormatted}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8.5 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw
              className={`size-3.5 ${
                isRefreshing || dashboard.isFetching || financeDashboard.isFetching
                  ? 'animate-spin text-[#00873E]'
                  : ''
              }`}
            />
            <span>{isRefreshing ? 'Đang cập nhật…' : 'Làm mới'}</span>
          </Button>

          {canViewPayments && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8.5 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <Link href="/admin/finance/payments">
                <Receipt className="size-3.5 text-emerald-600" />
                <span>Đơn nạp tiền</span>
              </Link>
            </Button>
          )}

          {canViewUsers && (
            <Button
              asChild
              size="sm"
              className="h-8.5 gap-1.5 rounded-xl bg-[#00873E] text-xs font-semibold text-white shadow-xs hover:bg-[#007033]"
            >
              <Link href="/admin/users">
                <Users className="size-3.5" />
                <span>Quản lý người dùng</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Operational Action Center (Việc Cần Xử Lý Ngay) */}
      {hasActionItems && (
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-amber-50/70 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950">
                  Trung tâm Cảnh báo Vận hành (Cần chú ý)
                </h3>
                <p className="mt-0.5 text-xs text-amber-800/90">
                  Hệ thống ghi nhận các tác vụ đang chờ quản trị viên phê duyệt hoặc phản hồi:
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {oldestPendingPayment && (
                <Link
                  href={`/admin/finance/payments/${encodeURIComponent(oldestPendingPayment.paymentNo)}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100/80 transition"
                >
                  <CreditCard className="size-3.5 text-amber-600" />
                  <span>Đơn nạp #{oldestPendingPayment.paymentNo} chờ duyệt</span>
                  <ChevronRight className="size-3" />
                </Link>
              )}

              {attentionTickets > 0 && canViewSupport && (
                <Link
                  href="/admin/support"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100/80 transition"
                >
                  <LifeBuoy className="size-3.5 text-amber-600" />
                  <span>{attentionTickets} vé hỗ trợ cần xử lý</span>
                  <ChevronRight className="size-3" />
                </Link>
              )}

              {(pendingUsers > 0 || lockedUsers > 0) && canViewUsers && (
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100/80 transition"
                >
                  <Users className="size-3.5 text-amber-600" />
                  <span>{pendingUsers + lockedUsers} tài khoản cần kiểm tra</span>
                  <ChevronRight className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Master KPI Metric Cards (4 Trụ Cột Doanh Nghiệp) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Doanh Thu & Nạp Tiền (Finance) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Doanh thu nạp tiền
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 truncate">
                {financeData ? (
                  <>
                    {formatAmount(financeData.payments.successful.amountVnd)}{' '}
                    <span className="text-base font-bold text-slate-500">₫</span>
                  </>
                ) : (
                  '— ₫'
                )}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-[#00873E] ring-1 ring-emerald-200/60 transition group-hover:scale-105">
              <Coins className="size-6" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 text-[11px]">
                <TrendingUp className="size-3" />
                {financeData?.payments.successful.count ?? 0} đơn thành công
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {financeData ? formatAmount(financeData.payments.successful.coinAmount) : '0'} Coin
              </span>
            </div>
            {pendingPayments > 0 && (
              <p className="text-[11px] font-medium text-amber-700">
                ⚠️ Có {pendingPayments} đơn nạp đang chờ thanh toán
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Tài Khoản Người Chơi (Community & Users) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Người dùng hệ thống
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {totalUsers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 ring-1 ring-blue-200/60 transition group-hover:scale-105">
              <Users className="size-6" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 rounded-full px-2 py-0.5 text-[11px]">
                <TrendingUp className="size-3" />
                +{users.registeredLast7Days} trong 7 ngày
              </span>
              <span className="text-slate-500 font-semibold text-[11px]">
                {activePercent}% hoạt động
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {activeUsers.toLocaleString('vi-VN')} tài khoản đã xác minh
            </p>
          </div>
        </div>

        {/* Card 3: Hệ Sinh Thái Game & Portal (Ecosystem) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Kho Game & CMS Portal
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {contentData?.games.total ?? 0} <span className="text-sm font-semibold text-slate-500">Games</span>
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 ring-1 ring-violet-200/60 transition group-hover:scale-105">
              <Gamepad2 className="size-6" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-violet-700 bg-violet-50 rounded-full px-2 py-0.5 text-[11px]">
                <Layers className="size-3" />
                {contentData?.games.public ?? 0} Game công khai
              </span>
              <span className="text-slate-500 font-semibold text-[11px]">
                {contentData?.events.active ?? 0} sự kiện active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {(contentData?.articles.published ?? 0) + (contentData?.articles.draft ?? 0)} bài viết & cẩm nang
            </p>
          </div>
        </div>

        {/* Card 4: Vận Hành & Khách Hàng (Support) */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Vé Hỗ Trợ Khách Hàng
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                {attentionTickets} <span className="text-sm font-semibold text-slate-500">Cần xử lý</span>
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-amber-600 ring-1 ring-amber-200/60 transition group-hover:scale-105">
              <LifeBuoy className="size-6" />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 rounded-full px-2 py-0.5 text-[11px]">
                <Clock3 className="size-3" />
                {unreadTickets} chưa đọc
              </span>
              <span className="text-amber-700 font-semibold text-[11px]">
                {unassignedTickets} chưa gán
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {newTickets} ticket mới gửi từ người chơi
            </p>
          </div>
        </div>
      </div>

      {/* 4. Visual Analytics & Segmented Breakdowns (2 Khối Trực Quan) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Visual Box 1: Dòng tiền & Trạng thái Nạp tiền */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-slate-900 sm:text-base">
                  Hiệu quả Nạp tiền & Dòng tiền
                </h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#00873E]">
                  Tỷ lệ thành công {paymentSuccessRate}%
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Phân bổ trạng thái tất cả {totalPayments.toLocaleString('vi-VN')} giao dịch nạp ZENX Coin
              </p>
            </div>
            {canViewPayments && (
              <Link
                href="/admin/finance/payments"
                className="inline-flex shrink-0 items-center text-xs font-bold text-[#00873E] hover:underline"
              >
                Chi tiết nạp <ChevronRight className="size-3" />
              </Link>
            )}
          </div>

          {/* Segmented Progress Bar */}
          <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
            {successPayments > 0 && (
              <div
                style={{ width: `${paymentSuccessRate}%` }}
                className="h-full rounded-l-full bg-emerald-500 transition-all duration-500"
                title={`Thành công: ${successPayments} (${paymentSuccessRate}%)`}
              />
            )}
            {pendingPayments > 0 && (
              <div
                style={{ width: `${paymentPendingRate}%` }}
                className="h-full bg-amber-400 transition-all duration-500"
                title={`Chờ thanh toán: ${pendingPayments} (${paymentPendingRate}%)`}
              />
            )}
            {refundedPayments > 0 && (
              <div
                style={{ width: `${paymentRefundedRate}%` }}
                className="h-full bg-purple-500 transition-all duration-500"
                title={`Đã hoàn tiền: ${refundedPayments} (${paymentRefundedRate}%)`}
              />
            )}
            {failedPayments > 0 && (
              <div
                style={{ width: `${paymentFailedRate}%` }}
                className="h-full rounded-r-full bg-rose-500 transition-all duration-500"
                title={`Thất bại: ${failedPayments} (${paymentFailedRate}%)`}
              />
            )}
          </div>

          {/* Financial Breakdown Badges */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-500">Thành công</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {successPayments.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({paymentSuccessRate}%)</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-semibold text-slate-500">Chờ duyệt</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {pendingPayments.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({paymentPendingRate}%)</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-purple-500" />
                <span className="text-[11px] font-semibold text-slate-500">Hoàn tiền</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {refundedPayments.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({paymentRefundedRate}%)</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500" />
                <span className="text-[11px] font-semibold text-slate-500">Thất bại / Hủy</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {failedPayments.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({paymentFailedRate}%)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Visual Box 2: Phân bổ Trạng thái Tài khoản Người Dùng */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-slate-900 sm:text-base">
                  Phân bổ Trạng thái Tài khoản
                </h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                  {totalUsers.toLocaleString('vi-VN')} tài khoản
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Tỷ lệ phân bố tình trạng người dùng trong toàn hệ thống
              </p>
            </div>
            {canViewUsers && (
              <Link
                href="/admin/users"
                className="inline-flex shrink-0 items-center text-xs font-bold text-[#00873E] hover:underline"
              >
                DS người dùng <ChevronRight className="size-3" />
              </Link>
            )}
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

          {/* User Status Legend Badges */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-slate-500">Hoạt động</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {activeUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({activePercent}%)</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-semibold text-slate-500">Chờ xác minh</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {pendingUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({pendingPercent}%)</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500">Tạm ngưng</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {suspendedUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({suspendedPercent}%)</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rose-500" />
                <span className="text-[11px] font-semibold text-slate-500">Bị khóa</span>
              </div>
              <p className="mt-1 text-xs font-black text-slate-900">
                {lockedUsers.toLocaleString('vi-VN')}{' '}
                <span className="text-[10px] text-slate-400">({lockedPercent}%)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Realtime Activity Center (2 Cột Cân Đối Hoàn Hảo) */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Left Column: Người dùng mới gia nhập */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 sm:text-base">
                    Người dùng mới đăng ký
                  </h3>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    Mới nhất
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Tài khoản người chơi gia nhập ZENX GO gần đây
                </p>
              </div>
              {canViewUsers && (
                <Link
                  href="/admin/users"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#00873E] hover:underline ml-3"
                >
                  <span>Xem tất cả ({totalUsers})</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {recentUsersList.length ? (
                recentUsersList.map((user) => <ModernUserRow key={user.id} user={user} />)
              ) : (
                <div className="p-10 text-center">
                  <Users className="mx-auto size-9 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">Chưa có người dùng</p>
                  <p className="text-xs text-slate-400">
                    Danh sách người dùng đăng ký sẽ hiển thị ở đây.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 p-3.5 text-center bg-slate-50/40 rounded-b-2xl">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#00873E] transition-colors"
            >
              Mở danh sách quản lý người dùng đầy đủ <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>

        {/* Right Column: Giao dịch nạp tiền gần nhất */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 sm:text-base">
                    Giao dịch nạp tiền mới nhất
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#00873E]">
                    Realtime
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Lịch sử đơn nạp ZENX Coin từ người chơi qua các cổng
                </p>
              </div>
              {canViewPayments && (
                <Link
                  href="/admin/finance/payments"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#00873E] hover:underline ml-3"
                >
                  <span>Xem tất cả ({totalPayments})</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {recentPaymentsList.length ? (
                recentPaymentsList.map((payment) => (
                  <ModernPaymentRow key={payment.paymentNo} payment={payment} />
                ))
              ) : recentPaymentsQuery.isLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((v) => (
                    <Skeleton key={v} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <Receipt className="mx-auto size-9 text-slate-300" />
                  <p className="mt-2 text-sm font-semibold text-slate-700">Chưa có giao dịch</p>
                  <p className="text-xs text-slate-400">
                    Các đơn nạp ZENX Coin mới nhất sẽ hiển thị ở đây.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 p-3.5 text-center bg-slate-50/40 rounded-b-2xl">
            <Link
              href="/admin/finance/payments"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#00873E] transition-colors"
            >
              Mở danh sách quản lý đơn nạp tiền đầy đủ <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* 6. Quick Launchpad (6 Phím Tắt Tác Vụ Quản Trị) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#00873E]" />
            <h3 className="text-sm font-bold text-slate-900">Phím tắt Tác vụ Quản trị Nhanh</h3>
          </div>
          <span className="text-xs text-slate-400">Điều hướng trực tiếp đến các tính năng</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link
            href="/admin/users"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white">
              <Search className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
                Người dùng
              </p>
              <p className="text-[10px] text-slate-400">Tra cứu & xử lý</p>
            </div>
          </Link>

          <Link
            href="/admin/finance/payments"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E] transition group-hover:scale-105 group-hover:bg-[#00873E] group-hover:text-white">
              <Receipt className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
                Đơn nạp tiền
              </p>
              <p className="text-[10px] text-slate-400">Duyệt & đối soát</p>
            </div>
          </Link>

          <Link
            href="/admin/finance/packages"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white">
              <Coins className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
                Gói ZENX Coin
              </p>
              <p className="text-[10px] text-slate-400">Đơn giá & khuyến mãi</p>
            </div>
          </Link>

          <Link
            href="/admin/content/games"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white">
              <Gamepad2 className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
                Kho Game Portal
              </p>
              <p className="text-[10px] text-slate-400">Cấu hình & xuất bản</p>
            </div>
          </Link>

          <Link
            href="/admin/content/articles/new"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
                Soạn bài viết
              </p>
              <p className="text-[10px] text-slate-400">Tin tức & cẩm nang</p>
            </div>
          </Link>

          <Link
            href="/admin/support"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-center shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00873E]/40 hover:shadow-xs"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition group-hover:scale-105 group-hover:bg-rose-600 group-hover:text-white">
              <LifeBuoy className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
                Hỗ trợ khách hàng
              </p>
              <p className="text-[10px] text-slate-400">Ticket & phản hồi</p>
            </div>
          </Link>
        </div>
      </div>

      {/* 7. System Status & Telemetry Bar (Hạ Tầng Giám Sát) */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 sm:p-5 text-xs text-slate-600">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#00873E]" />
            <span className="font-bold text-slate-800">Trạng thái Hạ tầng & Dịch vụ Nền tảng:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>API Gateway: <strong className="text-slate-700">Online</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Portal Web: <strong className="text-slate-700">Active</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>VietQR Service: <strong className="text-slate-700">Sẵn sàng</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>CASL RBAC: <strong className="text-slate-700">Enforced</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernUserRow({ user }: { user: AdminUserSummary }) {
  const fullName = user.profile?.fullName || user.username;

  return (
    <div className="group flex items-center justify-between gap-3 px-5 py-3.5 transition duration-150 hover:bg-slate-50/80 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
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
          className="size-8 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-[#00873E] hover:bg-[#E8F7EC] transition-all"
        >
          <Link href={`/admin/users/${user.id}`} aria-label={`Xem chi tiết ${user.username}`}>
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ModernPaymentRow({ payment }: { payment: AdminFinancePayment }) {
  const statusInfo = paymentStatusBadge[payment.status] || {
    label: payment.status,
    className: 'bg-slate-100 text-slate-600 border-slate-200/80',
    dotClass: 'bg-slate-400',
  };
  const userName = payment.user?.profile?.fullName || payment.user?.username || 'Khách hàng';

  return (
    <div className="group flex items-center justify-between gap-3 px-5 py-3.5 transition duration-150 hover:bg-slate-50/80 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E] font-mono text-xs font-bold ring-1 ring-emerald-200/60">
          <Receipt className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/finance/payments/${encodeURIComponent(payment.paymentNo)}`}
              className="font-mono text-xs font-bold text-slate-900 group-hover:text-[#00873E] hover:underline"
            >
              #{payment.paymentNo}
            </Link>
            <span className="truncate text-xs font-medium text-slate-600 hidden sm:inline">
              · {userName}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            <span className="font-semibold text-slate-800">
              {formatAmount(payment.amountVnd)} ₫
            </span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-[#00873E] font-medium font-mono">
              +{formatAmount(payment.coinAmount)} Coin
            </span>
            <span className="mx-1 text-slate-300">·</span>
            <span>{paymentMethodLabel(payment.paymentMethod)}</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusInfo.className}`}
        >
          <span className={`size-1.5 rounded-full ${statusInfo.dotClass}`} />
          {statusInfo.label}
        </span>
        <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
          {formatDate(payment.createdAt)}
        </span>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 hover:text-[#00873E] hover:bg-[#E8F7EC] transition-all"
        >
          <Link
            href={`/admin/finance/payments/${encodeURIComponent(payment.paymentNo)}`}
            aria-label={`Xem chi tiết đơn nạp ${payment.paymentNo}`}
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7 pb-10">
      <Skeleton className="h-16 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((v) => (
          <Skeleton key={v} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[420px] rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-14 rounded-2xl" />
    </div>
  );
}
