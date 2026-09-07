'use client';

import { useMemo, useState } from 'react';
import { Edit3, Filter, Plus, RefreshCw, Save, Tags, Trash2, X } from 'lucide-react';
import type { AdminContentGenre } from '@zenx-go/api-client';
import {
  useAdminContentGenreMutations,
  useAdminContentGenres,
} from '@/hooks/use-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

type Form = {
  code: string;
  name: string;
  slug: string;
  sortOrder: string;
  isActive: boolean;
};

const emptyForm: Form = {
  code: '',
  name: '',
  slug: '',
  sortOrder: '0',
  isActive: true,
};

export default function AdminContentGenresPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | 'ACTIVE' | 'INACTIVE'>('');
  const [editor, setEditor] = useState<{ item?: AdminContentGenre; form: Form } | null>(null);
  const query = useAdminContentGenres({ search: search.trim() || undefined, status: status || undefined });
  const mutations = useAdminContentGenreMutations();
  const items = useMemo(() => query.data ?? [], [query.data]);
  const pending = mutations.create.isPending || mutations.update.isPending;

  const openCreate = () => setEditor({ form: emptyForm });
  const openEdit = (item: AdminContentGenre) =>
    setEditor({
      item,
      form: {
        code: item.code,
        name: item.name,
        slug: item.slug,
        sortOrder: String(item.sortOrder),
        isActive: item.isActive,
      },
    });

  const save = () => {
    if (!editor) return;
    const form = editor.form;
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Hãy nhập tên và slug thể loại.');
      return;
    }
    if (editor.item) {
      mutations.update.mutate(
        {
          id: editor.item.id,
          input: {
            expectedUpdatedAt: editor.item.updatedAt,
            name: form.name.trim(),
            slug: form.slug.trim().toLowerCase(),
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder) || 0,
          },
        },
        {
          onSuccess: () => {
            toast.success('Đã cập nhật thể loại game.');
            setEditor(null);
          },
          onError: (error) => toast.error(getErrorMessage(error)),
        },
      );
      return;
    }
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9_]{2,32}$/.test(code)) {
      toast.error('Mã thể loại chỉ gồm A-Z, số và dấu gạch dưới.');
      return;
    }
    mutations.create.mutate(
      {
        code,
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        sortOrder: Number(form.sortOrder) || 0,
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo thể loại game.');
          setEditor(null);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };

  const remove = (item: AdminContentGenre) => {
    if (item.isActive || item.usageCount > 0) return;
    if (!window.confirm(`Xóa thể loại ${item.name}?`)) return;
    mutations.remove.mutate(item.id, {
      onSuccess: () => toast.success('Đã xóa thể loại game.'),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <div className="max-w-7xl space-y-5">
      <section className="rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-500/10 via-slate-50 to-white p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
              <Tags className="size-3.5" /> Content taxonomy
            </span>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Thể loại game
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý các nhãn phân loại hiển thị trong catalog và bộ lọc game.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
              <RefreshCw className={`size-4 ${query.isFetching ? 'animate-spin' : ''}`} /> Làm mới
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" /> Thể loại mới
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Taxonomy</p>
            <p className="mt-1 text-sm text-slate-500">{items.length} thể loại</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-slate-400" />
            <Select
              className="w-40"
              value={status}
              onChange={(event) => setStatus(event.target.value as '' | 'ACTIVE' | 'INACTIVE')}
              aria-label="Lọc trạng thái"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang dùng</option>
              <option value="INACTIVE">Ngừng dùng</option>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Input
            aria-label="Tìm thể loại"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã, tên hoặc slug…"
          />
        </div>

        {query.isLoading ? (
          <Skeleton className="mt-5 h-80 rounded-xl" />
        ) : query.isError ? (
          <div className="mt-5 rounded-xl bg-red-50 p-5 text-sm text-red-700">
            {getErrorMessage(query.error, 'Không thể tải danh sách thể loại.')}
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">Thể loại</th>
                  <th className="pb-3 pr-4">Slug</th>
                  <th className="pb-3 pr-4">Số game</th>
                  <th className="pb-3 pr-4">Thứ tự</th>
                  <th className="pb-3 pr-4">Trạng thái</th>
                  <th className="pb-3 pr-4">Cập nhật</th>
                  <th className="pb-3 text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const canDelete = !item.isActive && item.usageCount === 0;
                  return (
                    <tr key={item.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-4 pr-4">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{item.code}</p>
                      </td>
                      <td className="py-4 pr-4 font-mono text-xs text-slate-600">{item.slug}</td>
                      <td className="py-4 pr-4 font-semibold text-slate-700">{item.usageCount}</td>
                      <td className="py-4 pr-4 text-slate-600">{item.sortOrder}</td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.isActive ? 'Đang dùng' : 'Ngừng dùng'}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-xs text-slate-500">{formatDate(item.updatedAt)}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label={`Sửa ${item.name}`}>
                            <Edit3 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canDelete || mutations.remove.isPending}
                            title={canDelete ? 'Xóa thể loại' : 'Chỉ xóa thể loại inactive chưa được sử dụng'}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-slate-300"
                            onClick={() => remove(item)}
                            aria-label={`Xóa ${item.name}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!items.length ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-sm text-slate-500">
                      Chưa có thể loại phù hợp.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editor ? <GenreEditor editor={editor} setEditor={setEditor} pending={pending} onSave={save} /> : null}
    </div>
  );
}

function GenreEditor({
  editor,
  setEditor,
  pending,
  onSave,
}: {
  editor: { item?: AdminContentGenre; form: Form };
  setEditor: (value: { item?: AdminContentGenre; form: Form } | null) => void;
  pending: boolean;
  onSave: () => void;
}) {
  const set = <K extends keyof Form>(field: K, value: Form[K]) =>
    setEditor({ ...editor, form: { ...editor.form, [field]: value } });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              {editor.item ? 'Sửa thể loại game' : 'Tạo thể loại game'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Code được khóa sau khi tạo; slug dùng cho bộ lọc public.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setEditor(null)} aria-label="Đóng">
            <X className="size-4" />
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Mã thể loại">
            <Input value={editor.form.code} disabled={Boolean(editor.item)} onChange={(event) => set('code', event.target.value)} placeholder="MMORPG" />
          </Field>
          <Field label="Tên thể loại">
            <Input value={editor.form.name} onChange={(event) => set('name', event.target.value)} placeholder="Nhập vai trực tuyến" />
          </Field>
          <Field label="Slug">
            <Input value={editor.form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="nhap-vai-truc-tuyen" />
          </Field>
          <Field label="Thứ tự">
            <Input type="number" min={0} value={editor.form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} />
          </Field>
          {editor.item ? (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 sm:col-span-2">
              <input type="checkbox" checked={editor.form.isActive} onChange={(event) => set('isActive', event.target.checked)} className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]" />
              Đang hoạt động và cho phép gắn mới vào game
            </label>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditor(null)}>Hủy</Button>
          <Button onClick={onSave} disabled={pending}><Save className="size-4" /> {pending ? 'Đang lưu…' : 'Lưu thể loại'}</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-1.5 text-xs font-bold text-slate-600"><span>{label}</span>{children}</label>;
}
