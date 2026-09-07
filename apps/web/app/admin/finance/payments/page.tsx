'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Coins,
  Copy,
  CreditCard,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { PaymentMethod } from '@zenx-go/api-client';
import { useAdminFinancePayments } from '@/hooks/use-finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount, formatDate, paymentMethodLabels } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

const statusBadge: Record<string, { label: string; className: string }> = {
  CREATED: { label: 'Chờ thanh toán', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  SUCCESS: { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  FAILED: { label: 'Thất bại', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  EXPIRED: { label: 'Hết hạn', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  REFUNDED: { label: 'Đã hoàn tiền', className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

type FilterTab = 'ALL' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'OTHER';

const tabs: Array<{ id: FilterTab; label: string; dotClass?: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING', label: 'Chờ thanh toán', dotClass: 'bg-amber-500' },
  { id: 'SUCCESS', label: 'Thành công', dotClass: 'bg-emerald-500' },
  { id: 'FAILED', label: 'Thất bại', dotClass: 'bg-rose-500' },
  { id: 'REFUNDED', label: 'Đã hoàn tiền', dotClass: 'bg-purple-500' },
  { id: 'OTHER', label: 'Hết hạn / Hủy', dotClass: 'bg-slate-400' },
];

export default function AdminFinancePaymentsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'' | PaymentMethod>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Map active tab to status query
  const statusParam: string | undefined =
    activeTab === 'PENDING'
      ? 'PENDING,CREATED'
      : activeTab === 'SUCCESS'
      ? 'SUCCESS'
      : activeTab === 'FAILED'
      ? 'FAILED'
      : activeTab === 'REFUNDED'
      ? 'REFUNDED'
      : activeTab === 'OTHER'
      ? 'EXPIRED,CANCELLED'
      : undefined;

  const queryState = useAdminFinancePayments({
    page,
    pageSize: 20,
    search: search.trim() || undefined,
    status: statusParam,
    paymentMethod: paymentMethod || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const query = { ...queryState, data: queryState.data! };
  const statusCounts = query.data?.statusCounts;

  const getTabCount = (tabId: FilterTab): number | undefined => {
    if (!statusCounts) return undefined;
    switch (tabId) {
      case 'ALL':
        return Object.values(statusCounts).reduce((acc, count) => acc + count, 0);
      case 'PENDING':
        return (statusCounts.PENDING ?? 0) + (statusCounts.CREATED ?? 0);
      case 'SUCCESS':
        return statusCounts.SUCCESS ?? 0;
      case 'FAILED':
        return statusCounts.FAILED ?? 0;
      case 'REFUNDED':
        return statusCounts.REFUNDED ?? 0;
      case 'OTHER':
        return (statusCounts.EXPIRED ?? 0) + (statusCounts.CANCELLED ?? 0);
      default:
        return undefined;
    }
  };
  const hasFilters = Boolean(search || paymentMethod || from || to || activeTab !== 'ALL');

  const clearAllFilters = () => {
    setActiveTab('ALL');
    setSearch('');
    setPaymentMethod('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const copy = (text: string, key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Đã sao chép');
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/50 shadow-2xs">
          <Link
            href="/admin/finance/payments"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-black bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200/40 transition-all"
          >
            <CreditCard className="size-4 text-[#00873E]" />
            <span>Đơn nạp tiền</span>
            {query.data?.total !== undefined ? (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 tabular-nums">
                {query.data.total}
              </span>
            ) : null}
          </Link>
          <Link
            href="/admin/finance/transactions"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-all"
          >
            <Coins className="size-4 text-slate-400" />
            <span>Biến động số dư</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-slate-500 hover:text-slate-800 h-8 px-2.5"
            >
              <X className="size-3.5 mr-1" />
              Xóa bộ lọc
            </Button>
          ) : null}
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
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100/80 text-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.dotClass ? (
                <span className={`size-1.5 rounded-full ${isActive ? 'bg-white' : tab.dotClass}`} />
              ) : null}
              <span>{tab.label}</span>
              {count !== undefined ? (
                <span
                  className={`inline-flex items-center justify-center min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-bold tabular-nums leading-none transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-slate-200/80 text-slate-700'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Filter Row */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <Input
            className="pl-8 pr-8 h-8 rounded-xl text-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã đơn, khách, email..."
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 p-0.5"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>

        {/* Method */}
        <Select
          className="h-8 rounded-xl text-xs"
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value as '' | PaymentMethod);
            setPage(1);
          }}
        >
          <option value="">Tất cả hình thức thanh toán</option>
          {(['VIETQR', 'MOMO', 'ZALOPAY', 'BANK_TRANSFER', 'CARD'] as PaymentMethod[]).map((val) => (
            <option key={val} value={val}>
              {paymentMethodLabels[val] ?? val}
            </option>
          ))}
        </Select>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-1.5">
          <Input
            type="date"
            className="h-8 rounded-xl text-xs px-2"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            title="Từ ngày"
          />
          <Input
            type="date"
            className="h-8 rounded-xl text-xs px-2"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            title="Đến ngày"
          />
        </div>
      </div>

      {/* Main Table */}
      {query.isLoading ? (
        <Skeleton className="h-[480px] rounded-2xl" />
      ) : query.isError ? (
        <div className="rounded-2xl bg-rose-50 p-6 text-sm text-rose-700">
          {getErrorMessage(query.error, 'Không thể tải danh sách đơn nạp tiền.')}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="py-2.5 px-4">Mã đơn</th>
                  <th className="py-2.5 px-4">Khách hàng</th>
                  <th className="py-2.5 px-4">Số tiền & Coin</th>
                  <th className="py-2.5 px-4">Hình thức</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.items.map((item) => {
                  const status = statusBadge[item.status] || {
                    label: item.status,
                    className: 'bg-slate-100 text-slate-600 border-slate-200',
                  };
                  const userName = item.user.profile?.fullName || item.user.username;

                  return (
                    <tr
                      key={item.paymentNo}
                      className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/finance/payments/${encodeURIComponent(item.paymentNo)}`;
                      }}
                    >
                      {/* Payment No */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/finance/payments/${encodeURIComponent(item.paymentNo)}`}
                            className="font-mono font-bold text-slate-900 hover:text-[#00873E] transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.paymentNo}
                          </Link>
                          <button
                            type="button"
                            onClick={(e) => copy(item.paymentNo, item.paymentNo, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 transition-opacity p-0.5"
                            title="Sao chép mã đơn"
                          >
                            {copiedKey === item.paymentNo ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {item.coinPackage.name}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 truncate max-w-[180px]">{userName}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">
                          {item.user.phone || item.user.email}
                        </p>
                      </td>

                      {/* Amount & Coin */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">
                          {formatAmount(item.amountVnd)} <span className="font-normal text-slate-500">₫</span>
                        </p>
                        <p className="text-[11px] font-bold text-emerald-600">
                          +{formatAmount(item.coinAmount)} Coin
                        </p>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">
                          {paymentMethodLabels[item.paymentMethod ?? ''] ?? item.paymentMethod}
                        </p>
                        <p className="text-[11px] text-slate-400 uppercase">{item.provider}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${status.className}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {status.label}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-slate-500">{formatDate(item.createdAt)}</td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-100 transition-colors">
                          <ArrowRight className="size-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!query.data.items.length ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CreditCard className="mx-auto size-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Không tìm thấy đơn nạp tiền nào</p>
                      {hasFilters ? (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="mt-2 text-xs font-semibold text-[#00873E] hover:underline"
                        >
                          Xóa bộ lọc để xem tất cả
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
            <span>
              Trang {query.data.page} / {Math.max(1, query.data.totalPages)} ({query.data.total} đơn)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= query.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7 px-2.5 text-xs rounded-lg"
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
