'use client';

import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Layers,
  RefreshCw,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { useAdminFinanceDashboard } from '@/hooks/use-finance';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount, formatDate } from '@/lib/utils';

interface StatusConfig {
  label: string;
  dotClass: string;
  badgeClass: string;
}

const statusConfigs: Record<string, StatusConfig> = {
  PENDING: { label: 'Chờ thanh toán', dotClass: 'bg-amber-500', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  CREATED: { label: 'Mới tạo', dotClass: 'bg-blue-500', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  SUCCESS: { label: 'Thành công', dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: 'Thất bại', dotClass: 'bg-rose-500', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
  REFUNDED: { label: 'Đã hoàn tiền', dotClass: 'bg-purple-500', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  EXPIRED: { label: 'Hết hạn', dotClass: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
  CANCELLED: { label: 'Đã hủy', dotClass: 'bg-slate-400', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function AdminFinanceDashboardPage() {
  const query = useAdminFinanceDashboard();

  if (query.isLoading) {
    return (
      <div className="space-y-6 max-w-7xl">
        <Skeleton className="h-14 w-64 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-6 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="mx-auto size-8 text-rose-600 mb-2" />
        <p className="font-semibold text-rose-900">Không thể tải dữ liệu tổng quan tài chính</p>
        <p className="text-xs text-rose-700 mt-1">Vui lòng kiểm tra lại kết nối hoặc thử lại sau.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
          className="mt-4 text-xs"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const data = query.data;
  const pendingCount = (data.payments.byStatus.PENDING ?? 0) + (data.payments.byStatus.CREATED ?? 0);
  const successCount = data.payments.byStatus.SUCCESS ?? 0;
  const totalPayments = data.payments.total;
  const successRate = totalPayments > 0 ? Math.round((successCount / totalPayments) * 100) : 0;

  // Group status counts into user-friendly buckets
  const statusBuckets = [
    {
      key: 'PENDING',
      label: 'Chờ thanh toán',
      count: pendingCount,
      dotClass: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      key: 'SUCCESS',
      label: 'Thành công',
      count: successCount,
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      key: 'FAILED',
      label: 'Thất bại',
      count: data.payments.byStatus.FAILED ?? 0,
      dotClass: 'bg-rose-500',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      key: 'REFUNDED',
      label: 'Đã hoàn tiền',
      count: data.payments.byStatus.REFUNDED ?? 0,
      dotClass: 'bg-purple-500',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      key: 'OTHER',
      label: 'Hết hạn / Đã hủy',
      count: (data.payments.byStatus.EXPIRED ?? 0) + (data.payments.byStatus.CANCELLED ?? 0),
      dotClass: 'bg-slate-400',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Tổng quan tài chính</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thống kê doanh thu, tình trạng đơn nạp tiền và dòng tiền Coin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="text-xs h-8 px-3 rounded-xl"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${query.isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Button asChild size="sm" className="text-xs h-8 px-3 rounded-xl font-semibold shadow-xs">
            <Link href="/admin/finance/payments">
              <CreditCard className="size-3.5 mr-1.5" />
              Đơn nạp tiền
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Doanh thu thực nhận */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Doanh thu nạp tiền</span>
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {formatAmount(data.payments.successful.amountVnd)}{' '}
            <span className="text-base font-normal text-slate-500">₫</span>
          </p>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-600">
              +{formatAmount(data.payments.successful.coinAmount)} Coin
            </span>
            <span className="text-slate-400">{successCount} đơn thành công</span>
          </div>
        </div>

        {/* Tổng đơn nạp */}
        <Link
          href="/admin/finance/payments"
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-[#00873E]/40 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-[#00873E] transition-colors">
              Đơn nạp tiền
            </span>
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {totalPayments}{' '}
            <span className="text-base font-normal text-slate-500">đơn</span>
          </p>
          <div className="mt-1 flex items-center justify-between text-xs">
            {pendingCount > 0 ? (
              <span className="font-bold text-amber-600">{pendingCount} đơn chờ xử lý</span>
            ) : (
              <span className="text-slate-400">Đã xử lý hết</span>
            )}
            <span className="text-[#00873E] font-medium group-hover:underline">Chi tiết →</span>
          </div>
        </Link>

        {/* Đã hoàn tiền */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Đã hoàn tiền</span>
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <RotateCcw className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {formatAmount(data.payments.refunded.amountVnd)}{' '}
            <span className="text-base font-normal text-slate-500">₫</span>
          </p>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-purple-600 font-semibold">
              {data.payments.refunded.count} đơn đã hoàn
            </span>
            <span className="text-slate-400">
              −{formatAmount(data.payments.refunded.coinAmount)} Coin
            </span>
          </div>
        </div>

        {/* Gói nạp Coin */}
        <Link
          href="/admin/finance/packages"
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs hover:border-[#00873E]/40 hover:shadow-xs transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 group-hover:text-[#00873E] transition-colors">
              Gói nạp ZENX Coin
            </span>
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {data.packages.active}{' '}
            <span className="text-base font-normal text-slate-500">gói đang bán</span>
          </p>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">{data.packages.inactive} gói tạm ẩn</span>
            <span className="text-[#00873E] font-medium group-hover:underline">Cấu hình →</span>
          </div>
        </Link>
      </div>

      {/* Main Sections: Status Distribution & Action Center */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2/3): Tình trạng xử lý đơn nạp */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Tình trạng đơn nạp tiền</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân bổ số lượng đơn theo các trạng thái xử lý
              </p>
            </div>
            <Link
              href="/admin/finance/payments"
              className="text-xs font-bold text-[#00873E] hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>

          {/* Success Rate Bar */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Tỷ lệ nạp thành công</span>
              <span className="font-black text-emerald-600">{successRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          {/* Status Buckets List */}
          <div className="divide-y divide-slate-100">
            {statusBuckets.map((b) => (
              <div
                key={b.key}
                className="flex items-center justify-between py-2.5 px-1 hover:bg-slate-50/60 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`size-2 rounded-full ${b.dotClass}`} />
                  <span className="text-xs font-semibold text-slate-700">{b.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 tabular-nums">
                    {b.count} đơn
                  </span>
                  {totalPayments > 0 ? (
                    <span className="text-[11px] text-slate-400 w-10 text-right tabular-nums">
                      {Math.round((b.count / totalPayments) * 100)}%
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1/3): Action Center & Shortcuts */}
        <div className="space-y-4">
          {/* Action Box: Oldest Pending Payment */}
          {data.payments.oldestPending ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="size-4 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Cần duyệt đơn</span>
              </div>
              <div>
                <p className="text-xs text-amber-900">Đơn chờ lâu nhất trong hệ thống:</p>
                <p className="text-base font-mono font-black text-slate-900 mt-1">
                  {data.payments.oldestPending.paymentNo}
                </p>
                <p className="text-[11px] text-amber-800/80 mt-0.5">
                  Tạo lúc {formatDate(data.payments.oldestPending.createdAt)}
                </p>
              </div>
              <Button asChild size="sm" className="w-full text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs rounded-xl h-8">
                <Link href={`/admin/finance/payments/${encodeURIComponent(data.payments.oldestPending.paymentNo)}`}>
                  Mở duyệt đơn ngay
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex items-center gap-3.5">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Đã xử lý hết đơn</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Không có đơn nạp tiền nào đang chờ duyệt.
                </p>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Lối tắt tài chính
            </p>

            <Link
              href="/admin/finance/payments"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CreditCard className="size-3.5" />
                </span>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-[#00873E]">
                  Đơn nạp tiền
                </span>
              </div>
              <ArrowRight className="size-3.5 text-slate-400 group-hover:text-slate-700" />
            </Link>

            <Link
              href="/admin/finance/transactions"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Coins className="size-3.5" />
                </span>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-[#00873E]">
                  Biến động số dư
                </span>
              </div>
              <ArrowRight className="size-3.5 text-slate-400 group-hover:text-slate-700" />
            </Link>

            <Link
              href="/admin/finance/packages"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Layers className="size-3.5" />
                </span>
                <span className="text-xs font-semibold text-slate-800 group-hover:text-[#00873E]">
                  Cấu hình gói nạp
                </span>
              </div>
              <ArrowRight className="size-3.5 text-slate-400 group-hover:text-slate-700" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
