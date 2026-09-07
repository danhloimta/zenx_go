'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Coins,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { AdminFinanceCoinPackage, CoinPackageStatus } from '@zenx-go/api-client';
import { useAdminFinancePackageMutations, useAdminFinancePackages } from '@/hooks/use-finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAmount, formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

type Form = {
  code: string;
  name: string;
  priceVnd: string;
  coinAmount: string;
  status: CoinPackageStatus;
  sortOrder: string;
};

const blank: Form = {
  code: '',
  name: '',
  priceVnd: '',
  coinAmount: '',
  status: 'ACTIVE',
  sortOrder: '0',
};

type FilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

export default function AdminFinancePackagesPage() {
  const query = useAdminFinancePackages();
  const mutations = useAdminFinancePackageMutations();
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<{ item?: AdminFinanceCoinPackage; form: Form } | null>(null);

  const allItems = query.data ?? [];
  const activeCount = allItems.filter((item) => item.status === 'ACTIVE').length;
  const inactiveCount = allItems.filter((item) => item.status === 'INACTIVE').length;

  const items = useMemo(() => {
    return allItems
      .filter((item) => {
        if (filter !== 'ALL' && item.status !== filter) return false;
        if (search.trim()) {
          const s = search.trim().toLowerCase();
          return (
            item.name.toLowerCase().includes(s) ||
            item.code.toLowerCase().includes(s)
          );
        }
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [allItems, filter, search]);

  const openCreate = () => setEditor({ form: blank });
  const openEdit = (item: AdminFinanceCoinPackage) =>
    setEditor({
      item,
      form: {
        code: item.code,
        name: item.name,
        priceVnd: String(item.priceVnd),
        coinAmount: String(item.coinAmount),
        status: item.status,
        sortOrder: String(item.sortOrder),
      },
    });

  const submit = () => {
    if (!editor) return;
    const form = editor.form;
    if (
      !form.name.trim() ||
      !/^\d+$/.test(form.priceVnd) ||
      !/^\d+$/.test(form.coinAmount) ||
      BigInt(form.priceVnd || '0') <= BigInt(0) ||
      BigInt(form.coinAmount || '0') <= BigInt(0)
    ) {
      toast.error('Vui lòng nhập tên gói, giá tiền và số Coin hợp lệ (> 0).');
      return;
    }
    if (editor.item) {
      mutations.update.mutate(
        {
          id: editor.item.id,
          input: {
            expectedUpdatedAt: editor.item.updatedAt,
            name: form.name.trim(),
            priceVnd: form.priceVnd,
            coinAmount: form.coinAmount,
            status: form.status,
            sortOrder: Number(form.sortOrder) || 0,
          },
        },
        {
          onSuccess: () => {
            toast.success('Đã cập nhật gói nạp thành công');
            setEditor(null);
          },
          onError: (error) => toast.error(getErrorMessage(error, 'Không thể cập nhật gói nạp')),
        },
      );
    } else {
      if (!/^[A-Z0-9_]{2,32}$/.test(form.code.trim().toUpperCase())) {
        toast.error('Mã gói chỉ gồm chữ hoa (A-Z), số (0-9) và dấu gạch dưới (_).');
        return;
      }
      mutations.create.mutate(
        {
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          priceVnd: form.priceVnd,
          coinAmount: form.coinAmount,
          status: form.status,
          sortOrder: Number(form.sortOrder) || 0,
        },
        {
          onSuccess: () => {
            toast.success('Đã tạo gói nạp mới thành công');
            setEditor(null);
          },
          onError: (error) => toast.error(getErrorMessage(error, 'Không thể tạo gói nạp')),
        },
      );
    }
  };

  const remove = (item: AdminFinanceCoinPackage) => {
    if (item.status !== 'INACTIVE') {
      toast.error('Vui lòng chuyển trạng thái sang "Ngừng bán" trước khi xóa gói.');
      return;
    }
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa gói "${item.name}" (${item.code})?\n\nLưu ý: Gói đã từng phát sinh đơn nạp tiền sẽ không thể xóa để đảm bảo lịch sử đối soát.`,
      )
    )
      return;
    mutations.remove.mutate(item.id, {
      onSuccess: () => toast.success('Đã xóa gói nạp'),
      onError: (error) => toast.error(getErrorMessage(error, 'Không thể xóa gói nạp')),
    });
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Gói nạp ZENX Coin</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {allItems.length} gói
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình giá bán (VNĐ), số Coin nhận được và thứ tự hiển thị khi người chơi nạp tiền.
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

          <Button
            size="sm"
            onClick={openCreate}
            className="text-xs h-8 px-3.5 rounded-xl font-bold bg-[#00873E] hover:bg-[#00873E]/90 text-white shadow-xs"
          >
            <Plus className="size-4 mr-1.5" />
            Tạo gói nạp
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Tất cả</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                filter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {allItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('ACTIVE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filter === 'ACTIVE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Đang bán</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                filter === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('INACTIVE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
              filter === 'INACTIVE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="size-1.5 rounded-full bg-slate-400" />
            <span>Ngừng bán</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                filter === 'INACTIVE' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-slate-400" />
          <Input
            className="pl-8 pr-8 h-8 rounded-xl text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên gói hoặc mã gói..."
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Table Content */}
      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-6 text-center">
          <AlertCircle className="mx-auto size-8 text-rose-600 mb-2" />
          <p className="text-sm font-semibold text-rose-900">Không thể tải danh sách gói nạp</p>
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
                  <th className="py-2.5 px-4 w-14 text-center">Thứ tự</th>
                  <th className="py-2.5 px-4">Tên gói nạp</th>
                  <th className="py-2.5 px-4">Giá bán (VNĐ)</th>
                  <th className="py-2.5 px-4">Coin nhận được</th>
                  <th className="py-2.5 px-4">Tỷ giá quy đổi</th>
                  <th className="py-2.5 px-4">Trạng thái</th>
                  <th className="py-2.5 px-4">Cập nhật</th>
                  <th className="py-2.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {items.map((item) => {
                  const price = Number(item.priceVnd) || 0;
                  const coins = Number(item.coinAmount) || 0;
                  const rate = price > 0 ? (coins / price) * 1000 : 0;
                  const isActive = item.status === 'ACTIVE';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Sort Order */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex size-6 items-center justify-center rounded-lg bg-slate-100 text-slate-600 font-mono font-bold text-[11px]">
                          {item.sortOrder}
                        </span>
                      </td>

                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">{item.code}</p>
                      </td>

                      {/* Price VND */}
                      <td className="py-3 px-4">
                        <span className="text-sm font-black text-slate-900">
                          {formatAmount(item.priceVnd)}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">₫</span>
                      </td>

                      {/* Coin Amount */}
                      <td className="py-3 px-4">
                        <span className="text-sm font-black text-emerald-600">
                          +{formatAmount(item.coinAmount)}
                        </span>
                        <span className="text-xs text-emerald-700/70 font-semibold ml-1">Coin</span>
                      </td>

                      {/* Rate */}
                      <td className="py-3 px-4 text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {rate > 0 ? `${formatAmount(Math.round(rate))} Coin` : '—'}
                        </span>
                        <span className="text-[11px] text-slate-400"> / 1.000₫</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {isActive ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                      </td>

                      {/* Updated Date */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDate(item.updatedAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(item)}
                            className="h-7 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                          >
                            <Edit3 className="size-3.5 mr-1 text-slate-400" />
                            Sửa
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(item)}
                            className="h-7 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="size-3.5 mr-1 text-rose-500" />
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!items.length ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Coins className="mx-auto size-8 text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">Không tìm thấy gói nạp nào</p>
                      {filter !== 'ALL' || search ? (
                        <button
                          type="button"
                          onClick={() => {
                            setFilter('ALL');
                            setSearch('');
                          }}
                          className="mt-2 text-xs font-semibold text-[#00873E] hover:underline"
                        >
                          Xóa bộ lọc để xem tất cả
                        </button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={openCreate}
                          className="mt-3 text-xs font-semibold bg-[#00873E] hover:bg-[#00873E]/90 text-white rounded-xl"
                        >
                          <Plus className="size-3.5 mr-1" />
                          Tạo gói nạp đầu tiên
                        </Button>
                      )}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Thứ tự càng nhỏ sẽ được ưu tiên hiển thị trước trên giao diện nạp tiền của khách.</span>
            <span>Tổng số: {items.length} gói</span>
          </div>
        </div>
      )}

      {/* Package Editor Modal */}
      {editor ? (
        <PackageEditor
          editor={editor}
          setEditor={setEditor}
          pending={mutations.create.isPending || mutations.update.isPending}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}

function PackageEditor({
  editor,
  setEditor,
  pending,
  onSubmit,
}: {
  editor: { item?: AdminFinanceCoinPackage; form: Form };
  setEditor: (value: { item?: AdminFinanceCoinPackage; form: Form } | null) => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  const set = (field: keyof Form, value: string) =>
    setEditor({ ...editor, form: { ...editor.form, [field]: value } });

  const numPrice = Number(editor.form.priceVnd) || 0;
  const numCoins = Number(editor.form.coinAmount) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {editor.item ? 'Chỉnh sửa gói nạp' : 'Tạo gói nạp mới'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cung cấp các thông tin hiển thị và giá trị quy đổi cho gói nạp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditor(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên hiển thị gói <span className="text-rose-500">*</span>
              </label>
              <Input
                className="h-9 rounded-xl text-xs"
                value={editor.form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Ví dụ: Gói Cơ Bản 1.000 Coin"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã định danh gói <span className="text-rose-500">*</span>
              </label>
              <Input
                className="h-9 rounded-xl text-xs font-mono uppercase"
                value={editor.form.code}
                disabled={Boolean(editor.item)}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                placeholder="ZENX_1000"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {editor.item ? 'Mã gói không thể đổi sau khi tạo' : 'Chỉ dùng chữ hoa, số và dấu _'}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giá bán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <Input
                className="h-9 rounded-xl text-xs font-bold text-slate-900"
                inputMode="numeric"
                value={editor.form.priceVnd}
                onChange={(e) => set('priceVnd', e.target.value.replace(/\D/g, ''))}
                placeholder="20000"
              />
              {numPrice > 0 ? (
                <span className="text-[11px] font-bold text-slate-600 mt-0.5 block">
                  = {formatAmount(numPrice)} ₫
                </span>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Coin nhận được <span className="text-rose-500">*</span>
              </label>
              <Input
                className="h-9 rounded-xl text-xs font-bold text-emerald-600"
                inputMode="numeric"
                value={editor.form.coinAmount}
                onChange={(e) => set('coinAmount', e.target.value.replace(/\D/g, ''))}
                placeholder="1000"
              />
              {numCoins > 0 ? (
                <span className="text-[11px] font-bold text-emerald-600 mt-0.5 block">
                  = +{formatAmount(numCoins)} Coin
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Trạng thái bán</label>
              <Select
                className="h-9 rounded-xl text-xs"
                value={editor.form.status}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="ACTIVE">Đang bán (Hiển thị cho khách)</option>
                <option value="INACTIVE">Ngừng bán (Tạm ẩn khỏi shop)</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thứ tự hiển thị
              </label>
              <Input
                className="h-9 rounded-xl text-xs font-mono"
                type="number"
                min={0}
                value={editor.form.sortOrder}
                onChange={(e) => set('sortOrder', e.target.value)}
                placeholder="0"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Số nhỏ hơn xếp lên trước
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditor(null)}
            className="text-xs h-8 px-3 rounded-xl"
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={pending}
            className="text-xs h-8 px-4 rounded-xl font-bold bg-[#00873E] hover:bg-[#00873E]/90 text-white shadow-xs"
          >
            <Save className="size-3.5 mr-1.5" />
            {pending ? 'Đang lưu…' : editor.item ? 'Cập nhật' : 'Tạo gói'}
          </Button>
        </div>
      </div>
    </div>
  );
}
