'use client';

import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Coins,
  Copy,
  CreditCard,
  Download,
  RefreshCw,
  Search,
  WalletCards,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { WalletTransactionStatus, WalletTransactionType } from '@zenx-go/api-client';
import { useAdminFinanceTransactions } from '@/hooks/use-finance';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatAmount, formatDate, transactionTypeLabels } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const statusBadge: Record<string, { label: string; className: string }> = {
  SUCCESS: { label: 'Thành công', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PENDING: { label: 'Đang xử lý', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  FAILED: { label: 'Thất bại', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  REVERSED: { label: 'Đã hoàn tác', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

type TypeFilterTab = 'ALL' | WalletTransactionType;

const typeTabs: Array<{ id: TypeFilterTab; label: string; dotClass?: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'TOPUP', label: 'Nạp Coin', dotClass: 'bg-emerald-500' },
  { id: 'CREDIT', label: 'Cộng Coin', dotClass: 'bg-blue-500' },
  { id: 'DEBIT', label: 'Trừ Coin', dotClass: 'bg-rose-500' },
  { id: 'REFUND', label: 'Hoàn Coin', dotClass: 'bg-purple-500' },
];

export default function AdminFinanceTransactionsPage() {
  const [activeTab, setActiveTab] = useState<TypeFilterTab>('ALL');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | WalletTransactionStatus>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const typeParam = activeTab === 'ALL' ? undefined : activeTab;

  const queryState = useAdminFinanceTransactions({
    page,
    pageSize: 20,
    search: search.trim() || undefined,
    type: typeParam,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const query = { ...queryState, data: queryState.data! };
  const hasFilters = Boolean(search || status || from || to || activeTab !== 'ALL');

  const clearAllFilters = () => {
    setActiveTab('ALL');
    setSearch('');
    setStatus('');
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

  const download = async () => {
    setExporting(true);
    try {
      const blob = await api.admin.finance.exportTransactions({
        search: search.trim() || undefined,
        type: typeParam,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `zenx-bien-dong-vi-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống file đối soát');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xuất file đối soát.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header with Sub-Nav Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="inline-flex p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/50 shadow-2xs">
          <Link
            href="/admin/finance/payments"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-xl transition-all"
          >
            <CreditCard className="size-4 text-slate-400" />
            <span>Đơn nạp tiền</span>
          </Link>
          <Link
            href="/admin/finance/transactions"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-black bg-white text-slate-900 rounded-xl shadow-xs border border-slate-200/40 transition-all"
          >
            <Coins className="size-4 text-[#00873E]" />
            <span>Biến động số dư</span>
            {query.data?.total !== undefined ? (
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 tabular-nums">
                {query.data.total}
              </span>
            ) : null}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => void download()}
            disabled={exporting}
            className="text-xs h-8 px-3 rounded-xl border-slate-200"
          >
            <Download className="size-3.5 mr-1.5 text-slate-500" />
            {exporting ? 'Đang xuất…' : 'Xuất CSV'}
          </Button>
        </div>
      </div>

      {/* Quick Type Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100/80 text-xs">
        {typeTabs.map((tab) => {
          const isActive = activeTab === tab.id;
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
            </button>
          );
        })}
      </div>

      {/* Filter Row */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <Input
            className="pl-8 pr-8 h-8 rounded-xl text-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã giao dịch, khách, email, reference..."
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Status */}
        <Select
          className="h-8 rounded-xl text-xs"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | WalletTransactionStatus);
            setPage(1);
          }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="PENDING">Đang xử lý</option>
          <option value="FAILED">Thất bại</option>
          <option value="REVERSED">Đã hoàn tác</option>
        </Select>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5">
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
          <span className="text-slate-400 text-xs shrink-0">—</span>
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

      {/* Table Data */}
      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-6 text-center">
          <p className="text-sm font-semibold text-rose-800">
            {getErrorMessage(query.error, 'Không thể tải lịch sử biến động số dư')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            className="mt-3 text-xs"
          >
            Thử lại
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Giao dịch</th>
                  <th className="py-2.5 px-4">Khách hàng</th>
                  <th className="py-2.5 px-4">Biến động</th>
                  <th className="py-2.5 px-4">Số dư sau</th>
                  <th className="py-2.5 px-4">Nguồn / Hoạt động</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {query.data.items.map((item) => {
                  const userName =
                    item.user?.profile?.fullName ||
                    item.user?.username ||
                    item.user?.email ||
                    item.userId;
                  const statusInfo = statusBadge[item.status] ?? {
                    label: item.status,
                    className: 'bg-slate-100 text-slate-600 border-slate-200',
                  };
                  const isDebit = item.type === 'DEBIT';
                  const paymentRef = item.payment?.paymentNo || (item.referenceType === 'PAYMENT' ? item.referenceId : null);

                  return (
                    <tr
                      key={item.transactionNo}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Transaction No & Type */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">
                            {item.transactionNo}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copy(item.transactionNo, item.transactionNo, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 transition-opacity p-0.5"
                            title="Sao chép mã giao dịch"
                          >
                            {copiedKey === item.transactionNo ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {transactionTypeLabels[item.type] ?? item.type}
                        </p>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                          {userName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">
                          {item.user?.phone || item.user?.email || '—'}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-bold">
                          {isDebit ? (
                            <span className="inline-flex items-center text-rose-600">
                              <ArrowDownLeft className="size-3.5 mr-0.5" />
                              −{formatAmount(item.amount)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-emerald-600">
                              <ArrowUpRight className="size-3.5 mr-0.5" />
                              +{formatAmount(item.amount)}
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-slate-400">Coin</span>
                        </div>
                      </td>

                      {/* Balance After */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {item.balanceAfter !== undefined ? formatAmount(item.balanceAfter) : '—'}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">Coin</span>
                      </td>

                      {/* Reference / Source */}
                      <td className="py-3 px-4">
                        {paymentRef ? (
                          <Link
                            href={`/admin/finance/payments/${encodeURIComponent(paymentRef)}`}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#00873E] hover:underline"
                            title="Xem đơn nạp tiền"
                          >
                            <span>Đơn nạp {paymentRef}</span>
                            <ArrowRight className="size-3" />
                          </Link>
                        ) : item.description ? (
                          <p className="text-slate-700 truncate max-w-[200px]" title={item.description}>
                            {item.description}
                          </p>
                        ) : item.referenceType ? (
                          <p className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                            {item.referenceType}
                          </p>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusInfo.className}`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3 px-4 text-slate-500">{formatDate(item.createdAt)}</td>
                    </tr>
                  );
                })}

                {!query.data.items.length ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <WalletCards className="mx-auto size-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Không tìm thấy giao dịch ví nào</p>
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
              Trang {query.data.page} / {Math.max(1, query.data.totalPages)} ({query.data.total} giao dịch)
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
