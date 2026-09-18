'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  Users,
  RefreshCw,
  FileText,
  LifeBuoy,
  Gamepad2,
  ChevronRight,
  CreditCard,
  Coins,
  AlertTriangle,
  Receipt,
  Activity,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
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

import { InfoTooltip } from '@/components/ui/tooltip';

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
        Tài khoản chưa được cấp quyền xem bảng tổng quan này.
      </div>
    );
  }

  if (dashboard.isLoading) return <DashboardSkeleton />;

  if (dashboard.isError || !dashboard.data) {
    return (
      <div className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 text-sm text-red-700 shadow-xs">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-5 shrink-0 text-red-600" />
          <p className="font-semibold">Không thể tải dữ liệu tổng quan.</p>
        </div>
        <p className="mt-2 text-xs text-red-600">
          Vui lòng thử lại hoặc kiểm tra quyền tài khoản.
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
        toast.success('Đã cập nhật dữ liệu mới nhất');
      });
    } catch {
      toast.error('Lỗi khi làm mới dữ liệu');
    } finally {
      setIsRefreshing(false);
    }
  };

  const recentUsersList = data.recentUsers.slice(0, 6);
  const recentPaymentsList = recentPaymentsQuery.data?.items.slice(0, 6) ?? [];

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Header */}
      <PageHeader
        title="Tổng quan"
        icon={LayoutDashboard}
        badge={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-[#00873E]">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <InfoTooltip content="Dữ liệu thời gian thực" />
          </span>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5 rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
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
        }
        className="border-b border-slate-100 pb-3"
      />

      {/* 2. Cần xử lý */}
      {hasActionItems && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span className="text-xs font-bold text-amber-950">Cần xử lý:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {oldestPendingPayment && (
              <Link
                href={`/admin/finance/payments/${encodeURIComponent(oldestPendingPayment.paymentNo)}`}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition"
              >
                <CreditCard className="size-3 text-amber-600" />
                <span>Đơn #{oldestPendingPayment.paymentNo}</span>
                <ChevronRight className="size-3" />
              </Link>
            )}

            {attentionTickets > 0 && canViewSupport && (
              <Link
                href="/admin/support"
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition"
              >
                <LifeBuoy className="size-3 text-amber-600" />
                <span>{attentionTickets} hỗ trợ</span>
                <ChevronRight className="size-3" />
              </Link>
            )}

            {(pendingUsers > 0 || lockedUsers > 0) && canViewUsers && (
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100/70 transition"
              >
                <Users className="size-3 text-amber-600" />
                <span>{pendingUsers + lockedUsers} tài khoản</span>
                <ChevronRight className="size-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 3. Thẻ thống kê */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Doanh thu */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Doanh thu
                </span>
                <InfoTooltip content="Tổng tiền nạp thành công" />
              </div>
              <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 truncate">
                {financeData ? (
                  <>
                    {formatAmount(financeData.payments.successful.amountVnd)}{' '}
                    <span className="text-sm font-bold text-slate-500">₫</span>
                  </>
                ) : (
                  '— ₫'
                )}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]">
              <Coins className="size-5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700">
              {financeData?.payments.successful.count ?? 0} đơn thành công
            </span>
            {pendingPayments > 0 && (
              <span className="font-semibold text-amber-600">
                {pendingPayments} chờ duyệt
              </span>
            )}
          </div>
        </div>

        {/* Người dùng */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Người dùng
                </span>
                <InfoTooltip content="Tổng tài khoản đăng ký" />
              </div>
              <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">
                {totalUsers.toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="size-5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span className="font-semibold text-blue-700">
              +{users.registeredLast7Days} tuần này
            </span>
            <span>{activePercent}% hoạt động</span>
          </div>
        </div>

        {/* Trò chơi */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Trò chơi
                </span>
                <InfoTooltip content="Tổng số trò chơi và bài viết" />
              </div>
              <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">
                {contentData?.games.total ?? 0}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Gamepad2 className="size-5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span className="font-semibold text-violet-700">
              {contentData?.games.public ?? 0} mở
            </span>
            <span>{contentData?.articles.published ?? 0} bài viết</span>
          </div>
        </div>

        {/* Hỗ trợ */}
        <div className="group rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-xs transition hover:shadow-md">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hỗ trợ
                </span>
                <InfoTooltip content="Yêu cầu cần xử lý" />
              </div>
              <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-900">
                {attentionTickets}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <LifeBuoy className="size-5" />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
            <span className="font-semibold text-rose-600">
              {unreadTickets} chưa đọc
            </span>
            <span>{unassignedTickets} chưa nhận</span>
          </div>
        </div>
      </div>

      {/* 4. Tiến trình & Tỷ lệ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nạp tiền */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Nạp tiền</h3>
              <InfoTooltip content="Tỷ lệ trạng thái giao dịch" />
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#00873E]">
                {paymentSuccessRate}% thành công
              </span>
            </div>
            {canViewPayments && (
              <Link
                href="/admin/finance/payments"
                className="inline-flex items-center text-xs font-bold text-[#00873E] hover:underline"
              >
                Xem tất cả <ChevronRight className="size-3" />
              </Link>
            )}
          </div>

          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {successPayments > 0 && (
              <div
                style={{ width: `${paymentSuccessRate}%` }}
                className="h-full rounded-l-full bg-emerald-500"
                title={`Thành công: ${successPayments}`}
              />
            )}
            {pendingPayments > 0 && (
              <div
                style={{ width: `${paymentPendingRate}%` }}
                className="h-full bg-amber-400"
                title={`Chờ thanh toán: ${pendingPayments}`}
              />
            )}
            {refundedPayments > 0 && (
              <div
                style={{ width: `${paymentRefundedRate}%` }}
                className="h-full bg-purple-500"
                title={`Hoàn tiền: ${refundedPayments}`}
              />
            )}
            {failedPayments > 0 && (
              <div
                style={{ width: `${paymentFailedRate}%` }}
                className="h-full rounded-r-full bg-rose-500"
                title={`Thất bại: ${failedPayments}`}
              />
            )}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Thành công</span>
              <p className="font-bold text-slate-900">{successPayments}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Chờ duyệt</span>
              <p className="font-bold text-slate-900">{pendingPayments}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Hoàn tiền</span>
              <p className="font-bold text-slate-900">{refundedPayments}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Thất bại</span>
              <p className="font-bold text-slate-900">{failedPayments}</p>
            </div>
          </div>
        </div>

        {/* Tài khoản */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Tài khoản</h3>
              <InfoTooltip content="Tỷ lệ trạng thái tài khoản" />
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                {totalUsers.toLocaleString('vi-VN')} tài khoản
              </span>
            </div>
            {canViewUsers && (
              <Link
                href="/admin/users"
                className="inline-flex items-center text-xs font-bold text-[#00873E] hover:underline"
              >
                Xem tất cả <ChevronRight className="size-3" />
              </Link>
            )}
          </div>

          <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {activeUsers > 0 && (
              <div
                style={{ width: `${activePercent}%` }}
                className="h-full rounded-l-full bg-emerald-500"
                title={`Hoạt động: ${activeUsers}`}
              />
            )}
            {pendingUsers > 0 && (
              <div
                style={{ width: `${pendingPercent}%` }}
                className="h-full bg-amber-400"
                title={`Chờ xác minh: ${pendingUsers}`}
              />
            )}
            {suspendedUsers > 0 && (
              <div
                style={{ width: `${suspendedPercent}%` }}
                className="h-full bg-slate-400"
                title={`Tạm ngưng: ${suspendedUsers}`}
              />
            )}
            {lockedUsers > 0 && (
              <div
                style={{ width: `${lockedPercent}%` }}
                className="h-full rounded-r-full bg-rose-500"
                title={`Bị khóa: ${lockedUsers}`}
              />
            )}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Hoạt động</span>
              <p className="font-bold text-slate-900">{activeUsers}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Chờ duyệt</span>
              <p className="font-bold text-slate-900">{pendingUsers}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Tạm ngưng</span>
              <p className="font-bold text-slate-900">{suspendedUsers}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <span className="text-[11px] text-slate-500">Bị khóa</span>
              <p className="font-bold text-slate-900">{lockedUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Danh sách gần đây */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Người dùng mới */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Người dùng mới</h3>
              <InfoTooltip content="Tài khoản đăng ký gần đây" />
            </div>
            {canViewUsers && (
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#00873E] hover:underline"
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
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có người dùng mới.
              </div>
            )}
          </div>
        </section>

        {/* Đơn nạp mới */}
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Đơn nạp mới</h3>
              <InfoTooltip content="Giao dịch nạp gần đây" />
            </div>
            {canViewPayments && (
              <Link
                href="/admin/finance/payments"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#00873E] hover:underline"
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
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((v) => (
                  <Skeleton key={v} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có đơn nạp mới.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 6. Truy cập nhanh */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 px-1">
          <Sparkles className="size-4 text-[#00873E]" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Truy cập nhanh</h3>
          <InfoTooltip content="Lối tắt đến các trang quản lý chính" />
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          <Link
            href="/admin/users"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-3 text-center shadow-2xs transition hover:border-[#00873E]/50 hover:bg-[#E8F7EC]/30"
          >
            <Users className="size-5 text-blue-600 transition group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Người dùng
            </span>
          </Link>

          <Link
            href="/admin/finance/payments"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-3 text-center shadow-2xs transition hover:border-[#00873E]/50 hover:bg-[#E8F7EC]/30"
          >
            <Receipt className="size-5 text-[#00873E] transition group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Đơn nạp
            </span>
          </Link>

          <Link
            href="/admin/finance/packages"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-3 text-center shadow-2xs transition hover:border-[#00873E]/50 hover:bg-[#E8F7EC]/30"
          >
            <Coins className="size-5 text-amber-600 transition group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Gói nạp
            </span>
          </Link>

          <Link
            href="/admin/content/games"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-3 text-center shadow-2xs transition hover:border-[#00873E]/50 hover:bg-[#E8F7EC]/30"
          >
            <Gamepad2 className="size-5 text-violet-600 transition group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Trò chơi
            </span>
          </Link>

          <Link
            href="/admin/content/articles/new"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-3 text-center shadow-2xs transition hover:border-[#00873E]/50 hover:bg-[#E8F7EC]/30"
          >
            <FileText className="size-5 text-sky-600 transition group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Bài viết
            </span>
          </Link>

          <Link
            href="/admin/support"
            className="group flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white py-3 text-center shadow-2xs transition hover:border-[#00873E]/50 hover:bg-[#E8F7EC]/30"
          >
            <LifeBuoy className="size-5 text-rose-600 transition group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-[#00873E]">
              Hỗ trợ
            </span>
          </Link>
        </div>
      </div>

      {/* 7. Trạng thái hệ thống */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Activity className="size-3.5 text-[#00873E]" />
          <span className="font-bold text-slate-700">Hệ thống:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>API</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Web</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>VietQR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>Bảo mật</span>
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
            <span className="mx-1 text-slate-300">·</span>
            <span>{user.email}</span>
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
