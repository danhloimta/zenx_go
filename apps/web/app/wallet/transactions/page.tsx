'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, Copy, Download, Headphones, Minus, Plus, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { WalletTransactionStatus, WalletTransactionType } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatAmount, formatDate, isPositiveTransaction, paymentMethodLabel, transactionTypeLabel } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { EmptyState } from '@/components/empty-state';
import { toast } from 'sonner';

const pageSize = 10;
const transactionTypes: Array<WalletTransactionType | 'ALL'> = ['ALL', 'TOPUP', 'CREDIT', 'DEBIT', 'REFUND'];
const transactionStatuses: Array<WalletTransactionStatus | 'ALL'> = ['ALL', 'SUCCESS', 'PENDING', 'FAILED', 'REVERSED'];

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Skeleton className="h-96 rounded-2xl" /></div>}>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.get('search') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const rawType = params.get('type') ?? 'ALL';
  const rawStatus = params.get('status') ?? 'ALL';
  const type = transactionTypes.includes(rawType as WalletTransactionType | 'ALL') ? rawType as WalletTransactionType | 'ALL' : 'ALL';
  const status = transactionStatuses.includes(rawStatus as WalletTransactionStatus | 'ALL') ? rawStatus as WalletTransactionStatus | 'ALL' : 'ALL';
  const page = parsePage(params.get('page'));
  const selectedNo = params.get('transaction');
  const [searchDraft, setSearchDraft] = useState(search);
  const [fromDraft, setFromDraft] = useState(from);
  const [toDraft, setToDraft] = useState(to);

  useEffect(() => {
    setSearchDraft(search);
    setFromDraft(from);
    setToDraft(to);
  }, [from, search, to]);

  const updateQuery = useCallback((next: Record<string, string | number | undefined>) => {
    const nextParams = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'ALL' || value === 1) nextParams.delete(key);
      else nextParams.set(key, String(value));
    });
    const queryString = nextParams.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  const query = useQuery({
    queryKey: ['wallet', 'transactions', { page, pageSize, search, from, to, type, status }],
    queryFn: () => api.wallet.transactions({ page, pageSize, search, from, to, type, status }),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ['wallet', 'transaction', selectedNo],
    queryFn: () => api.wallet.transaction(selectedNo as string),
    enabled: Boolean(selectedNo),
    retry: false,
  });
  const totalPages = useMemo(() => Math.max(1, query.data?.totalPages ?? Math.ceil((query.data?.total ?? 0) / pageSize)), [query.data?.total, query.data?.totalPages]);

  useEffect(() => {
    if (!query.isLoading && query.data && page > totalPages) updateQuery({ page: totalPages });
  }, [page, query.data, query.isLoading, totalPages, updateQuery]);

  const pageNumbers = useMemo(() => buildPageNumbers(page, totalPages), [page, totalPages]);
  const firstItem = query.data?.total ? (page - 1) * pageSize + 1 : 0;
  const lastItem = query.data?.total ? Math.min(page * pageSize, query.data.total) : 0;
  const listSelected = query.data?.items.find((item) => item.transactionNo === selectedNo);
  const activeItem = detail.data || listSelected || (!selectedNo ? query.data?.items[0] : undefined);

  const exportCsv = async () => {
    try {
      const csv = await api.wallet.export({ search, from, to, type, status });
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `zenx-transactions-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất CSV thành công.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xuất CSV.'));
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Đã sao chép mã giao dịch.');
    } catch {
      toast.error('Không thể sao chép mã giao dịch.');
    }
  };

  const openTransaction = (transactionNo: string) => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      router.push(`/wallet/transactions/${encodeURIComponent(transactionNo)}`);
    } else {
      updateQuery({ transaction: transactionNo });
    }
  };

  return (
    <div className="max-w-[1300px] mx-auto pb-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px]">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DateFilter id="transactions-from" label="Từ ngày" value={fromDraft} onChange={(value) => { setFromDraft(value); if (value && toDraft && value > toDraft) { toast.error('Ngày bắt đầu phải trước ngày kết thúc.'); return; } updateQuery({ from: value, page: 1 }); }} />
            <DateFilter id="transactions-to" label="Đến ngày" value={toDraft} onChange={(value) => { setToDraft(value); if (fromDraft && value && fromDraft > value) { toast.error('Ngày kết thúc phải sau ngày bắt đầu.'); return; } updateQuery({ to: value, page: 1 }); }} />
            <div>
              <label htmlFor="transactions-type" className="block text-xs font-semibold text-slate-700 mb-1.5">Loại giao dịch</label>
              <SelectFilter id="transactions-type" value={type} onChange={(value) => updateQuery({ type: value, page: 1 })} options={[
                ['ALL', 'Tất cả'], ['TOPUP', 'Nạp Coin'], ['CREDIT', 'Cộng Coin'], ['DEBIT', 'Trừ Coin'], ['REFUND', 'Hoàn Coin'],
              ]} />
            </div>
            <div>
              <label htmlFor="transactions-status" className="block text-xs font-semibold text-slate-700 mb-1.5">Trạng thái</label>
              <SelectFilter id="transactions-status" value={status} onChange={(value) => updateQuery({ status: value, page: 1 })} options={[
                ['ALL', 'Tất cả'], ['SUCCESS', 'Thành công'], ['PENDING', 'Đang xử lý'], ['FAILED', 'Thất bại'], ['REVERSED', 'Đã đảo'],
              ]} />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input aria-label="Tìm kiếm giao dịch" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') updateQuery({ search: searchDraft.trim(), page: 1 }); }} placeholder="Tìm kiếm theo mô tả, mã giao dịch..." className="pl-10 text-xs" />
            </div>
            <Button variant="outline" size="sm" onClick={() => void exportCsv()} className="gap-2 text-xs font-semibold shrink-0 h-10 px-4"><Download className="size-3.5" />Xuất CSV</Button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs border-collapse">
              <thead><tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                <th className="pb-3 pr-4">Thời gian</th><th className="pb-3 px-3">Loại giao dịch</th><th className="pb-3 px-3">Mô tả</th><th className="pb-3 px-3 text-right">Số lượng</th><th className="pb-3 px-3 text-right">Số dư sau GD</th><th className="pb-3 pl-4 text-right">Trạng thái</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {query.isLoading ? Array.from({ length: 5 }).map((_, index) => <tr key={index}><td colSpan={6} className="py-4"><Skeleton className="h-10 w-full rounded-lg" /></td></tr>)
                  : query.isError ? <tr><td colSpan={6} className="py-6"><Alert>{getErrorMessage(query.error, 'Không thể tải giao dịch.')}</Alert></td></tr>
                  : !query.data?.items.length ? <tr><td colSpan={6} className="py-10 text-center"><EmptyState title="Không có giao dịch phù hợp" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." /></td></tr>
                  : query.data.items.map((item) => {
                    const positive = isPositiveTransaction(item.type);
                    const isSelected = item.transactionNo === selectedNo || (!selectedNo && item === query.data.items[0]);
                    return <tr key={item.transactionNo} tabIndex={0} role="button" aria-label={`Xem giao dịch ${item.transactionNo}`} aria-pressed={isSelected} onClick={() => openTransaction(item.transactionNo)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openTransaction(item.transactionNo); } }} className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00873E]/30 ${isSelected ? 'bg-[#F0FAF2] font-medium' : 'hover:bg-slate-50'}`}>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-slate-600">{formatDate(item.createdAt)}</td>
                      <td className="py-3.5 px-3"><div className="flex items-center gap-2"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${positive ? 'bg-[#00873E] text-white' : 'bg-[#EF4444] text-white'}`}>{positive ? <Plus className="size-3.5 stroke-[3]" /> : <Minus className="size-3.5 stroke-[3]" />}</span><span className="font-semibold text-slate-800">{transactionTypeLabel(item.type)}</span></div></td>
                      <td className="py-3.5 px-3 max-w-[220px]"><p className="truncate font-semibold text-slate-900">{item.description || 'Giao dịch ZENX'}</p><p className="text-[11px] text-slate-400 truncate">Mã giao dịch: {item.transactionNo}</p></td>
                      <td className={`py-3.5 px-3 text-right font-bold whitespace-nowrap ${positive ? 'text-[#00873E]' : 'text-red-500'}`}>{positive ? '+' : '-'}{formatAmount(item.amount)}</td>
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-700 whitespace-nowrap">{formatAmount(item.balanceAfter)}</td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap"><StatusBadge status={item.status} /></td>
                    </tr>;
                  })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>Hiển thị {firstItem} đến {lastItem} của {query.data?.total ?? 0} giao dịch</span>
            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <button aria-label="Trang trước" disabled={page <= 1} onClick={() => updateQuery({ page: page - 1 })} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">‹</button>
              {pageNumbers.map((value, index) => value === 'ellipsis' ? <span key={`ellipsis-${index}`} className="px-1 text-slate-400">…</span> : <button key={value} aria-label={`Trang ${value}`} aria-current={value === page ? 'page' : undefined} onClick={() => updateQuery({ page: value })} className={`flex size-8 items-center justify-center rounded-lg text-xs font-bold transition ${value === page ? 'bg-[#00873E] text-white shadow-xs' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>{value}</button>)}
              <button aria-label="Trang sau" disabled={page >= totalPages} onClick={() => updateQuery({ page: page + 1 })} className="flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40">›</button>
            </div>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 self-center sm:self-auto">{pageSize} / trang <ChevronDown className="size-3 text-slate-400" /></span>
          </div>
        </div>

        <aside className="h-fit"><div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sticky top-24">
          <div className="flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">Chi tiết giao dịch</h2>{selectedNo && <button aria-label="Đóng chi tiết giao dịch" onClick={() => updateQuery({ transaction: undefined })} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="size-4" /></button>}</div>
          {detail.isError && selectedNo ? <div className="mt-5"><Alert>{getErrorMessage(detail.error, 'Không thể tải chi tiết giao dịch.')}</Alert></div> : detail.isLoading && selectedNo && !activeItem ? <Skeleton className="mt-5 h-96 rounded-2xl" /> : activeItem ? <TransactionDetailPanel transaction={activeItem} onCopy={copyToClipboard} /> : <div className="py-8 text-center text-xs text-slate-400">Chọn một giao dịch để xem chi tiết</div>}
        </div></aside>
      </div>
    </div>
  );
}

function DateFilter({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return <div><label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label><div className="relative"><Input id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} className="pr-10 text-xs" /><Calendar className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /></div></div>;
}

function SelectFilter({ id, value, onChange, options }: { id: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <div className="relative"><select id={id} className="flex h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2 pr-10 text-xs font-medium text-slate-900 outline-none transition focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /></div>;
}

function TransactionDetailPanel({ transaction, onCopy }: { transaction: Awaited<ReturnType<typeof api.wallet.transaction>>; onCopy: (text: string) => void }) {
  const positive = isPositiveTransaction(transaction.type);
  const payment = transaction.payment;
  return <div className="mt-5 space-y-5">
    <div className={`rounded-2xl p-5 text-center ${positive ? 'bg-[#E8F7EC]' : 'bg-red-50'}`}>
      <div className={`mx-auto flex size-10 items-center justify-center rounded-full text-white shadow-xs ${positive ? 'bg-[#00873E]' : 'bg-red-500'}`}>{positive ? <Plus className="size-5 stroke-[3]" /> : <Minus className="size-5 stroke-[3]" />}</div>
      <p className="mt-2.5 text-sm font-bold text-slate-900">{transactionTypeLabel(transaction.type)}</p><div className="mt-1"><StatusBadge status={transaction.status} /></div>
      <p className={`mt-2 text-2xl font-black ${positive ? 'text-[#00873E]' : 'text-red-500'}`}>{positive ? '+' : '-'}{formatAmount(transaction.amount)} ZENX</p>
      <button onClick={() => onCopy(transaction.transactionNo)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#00873E]"><span>Mã giao dịch: {transaction.transactionNo}</span><Copy className="size-3" /></button>
    </div>
    <div><h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thông tin giao dịch</h3><div className="mt-3 space-y-2.5 text-xs">
      <DetailRow label="Thời gian" value={formatDate(transaction.createdAt)} /><DetailRow label="Loại giao dịch" value={transactionTypeLabel(transaction.type)} /><DetailRow label="Số lượng" value={`${positive ? '+' : '-'}${formatAmount(transaction.amount)} ZENX`} highlight={positive} /><DetailRow label="Số dư trước GD" value={formatAmount(transaction.balanceBefore, ' ZENX')} /><DetailRow label="Số dư sau GD" value={formatAmount(transaction.balanceAfter, ' ZENX')} /><DetailRow label="Trạng thái" value={<StatusBadge status={transaction.status} />} /><DetailRow label="Mô tả" value={transaction.description || '—'} />
    </div></div>
    {payment ? <><div className="h-px bg-slate-100" /><div><h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Thông tin thanh toán</h3><div className="mt-3 space-y-2.5 text-xs"><DetailRow label="Kênh thanh toán" value={paymentMethodLabel(payment.paymentMethod)} /><DetailRow label="Nhà cung cấp" value={payment.provider || '—'} /><DetailRow label="Mã payment" value={payment.paymentNo} /><DetailRow label="Mã giao dịch provider" value={payment.providerTransactionId || '—'} /><DetailRow label="Thanh toán lúc" value={formatDate(payment.paidAt)} /></div></div></> : null}
    <div className="h-px bg-slate-100" /><div><h3 className="text-xs font-bold text-slate-900">Bạn cần hỗ trợ?</h3><p className="mt-1 text-[11px] text-slate-500 leading-normal">Nếu bạn gặp vấn đề với giao dịch này, vui lòng gửi yêu cầu để được hỗ trợ.</p><Button asChild variant="zenx-outline" className="mt-3 w-full gap-2 text-xs font-semibold h-10 rounded-xl"><a href="/support/report-issue"><Headphones className="size-3.5" />Tạo yêu cầu hỗ trợ</a></Button></div>
  </div>;
}

function DetailRow({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-slate-500">{label}</span><span className={`text-right font-semibold ${highlight ? 'text-[#00873E]' : 'text-slate-900'}`}>{value}</span></div>;
}

function parsePage(value: string | null) {
  const parsed = Number(value ?? 1);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

function buildPageNumbers(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.max(2, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages - 1, start + 4);
  const pages: Array<number | 'ellipsis'> = [1];
  if (start > 2) pages.push('ellipsis');
  for (let value = start; value <= end; value += 1) pages.push(value);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);
  return pages;
}
