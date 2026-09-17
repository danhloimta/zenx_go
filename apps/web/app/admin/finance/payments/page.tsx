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
  Receipt,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useMemo, useState } from 'react';
import type { AdminFinancePayment, PaymentMethod } from '@zenx-go/api-client';
import { useAdminFinancePayments } from '@/hooks/use-finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount, formatDate, paymentMethodLabels } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';
import { CommonTable, type ColumnDef, type TableAction } from '@/components/ui/common-table';

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
  const [pageSize, setPageSize] = useState(20);
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
    pageSize,
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

  const columns = useMemo<ColumnDef<AdminFinancePayment>[]>(
    () => [
      {
        id: 'paymentNo',
        header: 'Mã đơn & Gói nạp',
        minWidth: 200,
        cell: (item) => (
          <div>
            <div className="flex items-center gap-1.5">
              <Link
                href={`/admin/finance/payments/${encodeURIComponent(item.paymentNo)}`}
                className="font-mono font-bold text-slate-900 hover:text-[#00873E] transition-colors whitespace-nowrap"
              >
                {item.paymentNo}
              </Link>
              <button
                type="button"
                onClick={(e) => copy(item.paymentNo, item.paymentNo, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 transition-opacity p-0.5 cursor-pointer"
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
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Khách hàng',
        minWidth: 180,
        cell: (item) => {
          const userName = item.user.profile?.fullName || item.user.username;
          return (
            <div>
              <p className="font-semibold text-slate-900 truncate max-w-[180px]">{userName}</p>
              <p className="text-[11px] text-slate-400 truncate max-w-[180px] font-mono">
                {item.user.phone || item.user.email}
              </p>
            </div>
          );
        },
      },
      {
        id: 'amount',
        header: 'Số tiền & Coin',
        minWidth: 160,
        cell: (item) => (
          <div className="whitespace-nowrap">
            <p className="font-bold text-slate-900">
              {formatAmount(item.amountVnd)} <span className="font-normal text-slate-500">₫</span>
            </p>
            <p className="text-[11px] font-bold text-emerald-600">
              +{formatAmount(item.coinAmount)} Coin
            </p>
          </div>
        ),
      },
      {
        id: 'method',
        header: 'Hình thức & Cổng',
        minWidth: 160,
        cell: (item) => (
          <div className="whitespace-nowrap">
            <p className="font-medium text-slate-800">
              {paymentMethodLabels[item.paymentMethod ?? ''] ?? item.paymentMethod}
            </p>
            <p className="text-[11px] text-slate-400 uppercase">{item.provider}</p>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Trạng thái',
        minWidth: 140,
        cell: (item) => {
          const status = statusBadge[item.status] || {
            label: item.status,
            className: 'bg-slate-100 text-slate-600 border-slate-200',
          };
          return (
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold whitespace-nowrap shrink-0 ${status.className}`}
            >
              <span className="size-1.5 rounded-full bg-current shrink-0" />
              {status.label}
            </span>
          );
        },
      },
      {
        id: 'createdAt',
        header: 'Thời gian',
        minWidth: 140,
        cell: (item) => (
          <span className="text-slate-500 whitespace-nowrap text-xs">{formatDate(item.createdAt)}</span>
        ),
      },
    ],
    [copiedKey],
  );

  const actions = (item: AdminFinancePayment): TableAction<AdminFinancePayment>[] => [
    {
      key: 'view',
      label: 'Xem chi tiết đơn nạp',
      icon: ArrowRight,
      href: `/admin/finance/payments/${encodeURIComponent(item.paymentNo)}`,
    },
    {
      key: 'copy',
      label: 'Sao chép mã đơn',
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(item.paymentNo);
        toast.success(`Đã sao chép mã ${item.paymentNo}`);
      },
    },
  ];

  return (
    <div className="space-y-4 w-full">
      {/* Header */}
      <PageHeader
        title="Đơn nạp tiền"
        icon={Receipt}
        description="Quản lý và tra cứu đơn nạp ZENX Coin, trạng thái thanh toán từ người dùng."
        badge={
          query.data?.total !== undefined ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {query.data.total} đơn
            </span>
          ) : null
        }
        actions={
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
        }
        className="pb-3 border-b border-slate-100"
      >
        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/50 shadow-2xs self-start">
          <Link
            href="/admin/finance/payments"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-xs border border-slate-200/40 transition-all"
          >
            <CreditCard className="size-3.5 text-[#00873E]" />
            <span>Đơn nạp tiền</span>
          </Link>
          <Link
            href="/admin/finance/transactions"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-white/60 rounded-lg transition-all"
          >
            <Coins className="size-3.5 text-slate-400" />
            <span>Biến động số dư</span>
          </Link>
        </div>
      </PageHeader>

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
        <CommonTable<AdminFinancePayment>
          showIndexColumn
          data={query.data?.items ?? []}
          columns={columns}
          actions={actions}
          actionHeaderTitle="Thao tác"
          isLoading={query.isLoading}
          isFetching={query.isFetching}
          emptyTitle="Không tìm thấy đơn nạp tiền nào"
          emptyDescription={
            hasFilters
              ? 'Không có đơn nạp tiền nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.'
              : 'Chưa có đơn nạp tiền nào trên hệ thống.'
          }
          emptyIcon={Receipt}
          emptyAction={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="mt-3 text-xs gap-1.5 border-slate-200 font-semibold"
              >
                <X className="size-3" /> Xóa bộ lọc
              </Button>
            ) : undefined
          }
          pagination={{
            page,
            pageSize,
            totalItems: query.data?.total ?? 0,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newSize) => {
              setPageSize(newSize);
              setPage(1);
            },
            pageSizeOptions: [10, 20, 50],
          }}
        />
      )}
    </div>
  );
}
