'use client';

import { useMemo, useState } from 'react';
import { Coins, Edit3, Plus, RefreshCw, Save, Trash2, X } from 'lucide-react';
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

const blank: Form = { code: '', name: '', priceVnd: '', coinAmount: '', status: 'ACTIVE', sortOrder: '0' };

export default function AdminFinancePackagesPage() {
  const query = useAdminFinancePackages();
  const mutations = useAdminFinancePackageMutations();
  const [filter, setFilter] = useState<'' | CoinPackageStatus>('');
  const [editor, setEditor] = useState<{ item?: AdminFinanceCoinPackage; form: Form } | null>(null);
  const items = useMemo(() => (query.data ?? []).filter((item) => !filter || item.status === filter), [filter, query.data]);

  const openCreate = () => setEditor({ form: blank });
  const openEdit = (item: AdminFinanceCoinPackage) => setEditor({ item, form: { code: item.code, name: item.name, priceVnd: String(item.priceVnd), coinAmount: String(item.coinAmount), status: item.status, sortOrder: String(item.sortOrder) } });
  const submit = () => {
    if (!editor) return;
    const form = editor.form;
    if (!form.name.trim() || !/^\d+$/.test(form.priceVnd) || !/^\d+$/.test(form.coinAmount) || BigInt(form.priceVnd || '0') <= BigInt(0) || BigInt(form.coinAmount || '0') <= BigInt(0)) {
      toast.error('Hãy nhập tên, giá và số Coin hợp lệ.');
      return;
    }
    if (editor.item) {
      mutations.update.mutate({ id: editor.item.id, input: { expectedUpdatedAt: editor.item.updatedAt, name: form.name.trim(), priceVnd: form.priceVnd, coinAmount: form.coinAmount, status: form.status, sortOrder: Number(form.sortOrder) || 0 } }, { onSuccess: () => { toast.success('Đã cập nhật gói nạp.'); setEditor(null); }, onError: (error) => toast.error(getErrorMessage(error)) });
    } else {
      if (!/^[A-Z0-9_]{2,32}$/.test(form.code.trim().toUpperCase())) { toast.error('Mã gói chỉ gồm A-Z, số và dấu gạch dưới.'); return; }
      mutations.create.mutate({ code: form.code.trim().toUpperCase(), name: form.name.trim(), priceVnd: form.priceVnd, coinAmount: form.coinAmount, status: form.status, sortOrder: Number(form.sortOrder) || 0 }, { onSuccess: () => { toast.success('Đã tạo gói nạp.'); setEditor(null); }, onError: (error) => toast.error(getErrorMessage(error)) });
    }
  };
  const remove = (item: AdminFinanceCoinPackage) => {
    if (item.status !== 'INACTIVE') { toast.error('Hãy ngừng bán gói trước khi xóa.'); return; }
    if (!window.confirm(`Xóa gói ${item.name}? Gói đã có payment sẽ không thể xóa.`)) return;
    mutations.remove.mutate(item.id, { onSuccess: () => toast.success('Đã xóa gói nạp.'), onError: (error) => toast.error(getErrorMessage(error)) });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-500/10 via-emerald-50/50 to-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div><div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800"><Coins className="size-3.5" /> Finance Operations</div><h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Gói nạp ZENX Coin</h1><p className="mt-1 text-sm text-slate-600">Cấu hình giá, số Coin, trạng thái bán và thứ tự hiển thị cho người dùng.</p></div>
          <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw className={`size-4 ${query.isFetching ? 'animate-spin' : ''}`} /> Làm mới</Button><Button size="sm" onClick={openCreate}><Plus className="size-4" /> Gói mới</Button></div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Danh sách cấu hình</p><p className="mt-1 text-sm text-slate-500">{items.length} gói đang hiển thị</p></div><Select className="w-44" value={filter} onChange={(event) => setFilter(event.target.value as '' | CoinPackageStatus)}><option value="">Tất cả trạng thái</option><option value="ACTIVE">Đang bán</option><option value="INACTIVE">Ngừng bán</option></Select></div>
        {query.isLoading ? <Skeleton className="mt-5 h-80 rounded-xl" /> : query.isError ? <div className="mt-5 rounded-xl bg-red-50 p-5 text-sm text-red-700">Không thể tải gói nạp.</div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400"><th className="pb-3 pr-4">Gói</th><th className="pb-3 pr-4">Giá VND</th><th className="pb-3 pr-4">Coin nhận</th><th className="pb-3 pr-4">Tỷ lệ</th><th className="pb-3 pr-4">Trạng thái</th><th className="pb-3 pr-4">Cập nhật</th><th className="pb-3 text-right"> </th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-slate-50 last:border-0"><td className="py-4 pr-4"><p className="font-bold text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-400">{item.code} · thứ tự {item.sortOrder}</p></td><td className="py-4 pr-4 font-semibold text-slate-700">{formatAmount(item.priceVnd)} ₫</td><td className="py-4 pr-4 font-bold text-emerald-700">{formatAmount(item.coinAmount)} ZENX</td><td className="py-4 pr-4 text-xs text-slate-500">{formatAmount(item.priceVnd && item.coinAmount ? Number(item.coinAmount) / Number(item.priceVnd) * 1000 : 0)} / 1k₫</td><td className="py-4 pr-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}</span></td><td className="py-4 pr-4 text-xs text-slate-500">{formatDate(item.updatedAt)}</td><td className="py-4 text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label={`Sửa ${item.name}`}><Edit3 className="size-4" /></Button><Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => remove(item)} aria-label={`Xóa ${item.name}`}><Trash2 className="size-4" /></Button></div></td></tr>)}{!items.length ? <tr><td colSpan={7} className="py-14 text-center text-sm text-slate-500">Chưa có gói nạp phù hợp.</td></tr> : null}</tbody></table></div>}
      </section>
      {editor ? <PackageEditor editor={editor} setEditor={setEditor} pending={mutations.create.isPending || mutations.update.isPending} onSubmit={submit} /> : null}
    </div>
  );
}

function PackageEditor({ editor, setEditor, pending, onSubmit }: { editor: { item?: AdminFinanceCoinPackage; form: Form }; setEditor: (value: { item?: AdminFinanceCoinPackage; form: Form } | null) => void; pending: boolean; onSubmit: () => void }) {
  const set = (field: keyof Form, value: string) => setEditor({ ...editor, form: { ...editor.form, [field]: value } });
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-black text-slate-900">{editor.item ? 'Sửa gói nạp' : 'Tạo gói nạp'}</h2><p className="mt-1 text-xs text-slate-500">Giá và số Coin dùng số nguyên, không nhập dấu phân cách.</p></div><Button variant="ghost" size="icon" onClick={() => setEditor(null)}><X className="size-4" /></Button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Mã gói"><Input value={editor.form.code} disabled={Boolean(editor.item)} onChange={(event) => set('code', event.target.value)} placeholder="ZENX_1000" /></Field><Field label="Tên gói"><Input value={editor.form.name} onChange={(event) => set('name', event.target.value)} placeholder="ZENX 1,000" /></Field><Field label="Giá VND"><Input inputMode="numeric" value={editor.form.priceVnd} onChange={(event) => set('priceVnd', event.target.value.replace(/\D/g, ''))} placeholder="20000" /></Field><Field label="Số Coin"><Input inputMode="numeric" value={editor.form.coinAmount} onChange={(event) => set('coinAmount', event.target.value.replace(/\D/g, ''))} placeholder="1000" /></Field><Field label="Trạng thái"><Select value={editor.form.status} onChange={(event) => set('status', event.target.value)}><option value="ACTIVE">Đang bán</option><option value="INACTIVE">Ngừng bán</option></Select></Field><Field label="Thứ tự"><Input type="number" min={0} value={editor.form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} /></Field></div><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setEditor(null)}>Hủy</Button><Button onClick={onSubmit} disabled={pending}><Save className="size-4" /> {pending ? 'Đang lưu…' : 'Lưu gói nạp'}</Button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-1.5 text-xs font-bold text-slate-600"><span>{label}</span>{children}</label>; }
