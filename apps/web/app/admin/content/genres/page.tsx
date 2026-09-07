'use client';

import { useMemo, useState } from 'react';
import { Edit3, Plus, RefreshCw, Save, Search, Trash2, X } from 'lucide-react';
import type { AdminContentGenre } from '@zenx-go/api-client';
import {
  useAdminContentGenreMutations,
  useAdminContentGenres,
} from '@/hooks/use-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { codefy, formatDate, slugify } from '@/lib/utils';
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
  const allGenresQuery = useAdminContentGenres({});
  const mutations = useAdminContentGenreMutations();

  const items = useMemo(() => query.data ?? [], [query.data]);
  const allGenres = useMemo(() => allGenresQuery.data ?? [], [allGenresQuery.data]);

  const activeCount = useMemo(() => allGenres.filter((g) => g.isActive).length, [allGenres]);
  const inactiveCount = useMemo(() => allGenres.filter((g) => !g.isActive).length, [allGenres]);

  const quickTabs: Array<{ value: '' | 'ACTIVE' | 'INACTIVE'; label: string; count: number }> = [
    { value: '', label: 'Tất cả', count: allGenres.length },
    { value: 'ACTIVE', label: 'Đang dùng', count: activeCount },
    { value: 'INACTIVE', label: 'Ngừng dùng', count: inactiveCount },
  ];

  const hasActiveFilters = Boolean(search || status);
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
    const name = form.name.trim();
    if (!name) {
      toast.error('Hãy nhập tên thể loại.');
      return;
    }

    let slug = form.slug.trim().toLowerCase();
    if (!slug) {
      slug = slugify(name);
    } else {
      slug = slugify(slug);
    }

    if (!slug) {
      toast.error('Đường dẫn tĩnh (slug) không hợp lệ.');
      return;
    }

    if (editor.item) {
      mutations.update.mutate(
        {
          id: editor.item.id,
          input: {
            expectedUpdatedAt: editor.item.updatedAt,
            name,
            slug,
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

    let code = form.code.trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (!code) {
      code = codefy(name);
    }

    if (!/^[A-Z0-9_]{2,32}$/.test(code)) {
      toast.error('Mã thể loại phải từ 2 đến 32 ký tự, chỉ gồm A-Z, 0-9 và dấu gạch dưới.');
      return;
    }

    mutations.create.mutate(
      {
        code,
        name,
        slug,
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Thể loại game
            </h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {allGenres.length} thể loại
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="h-8 text-xs gap-1.5 border-slate-200 bg-white font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <RefreshCw className={`size-3.5 ${query.isFetching ? 'animate-spin text-[#00873E]' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            size="sm"
            onClick={openCreate}
            className="h-8 text-xs gap-1.5 font-semibold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Thêm thể loại</span>
          </Button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {quickTabs.map((tab) => {
          const active = status === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`group inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200/90 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200/80 group-hover:text-slate-900'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Tìm thể loại"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã, tên hoặc slug thể loại…"
            className="h-8 rounded-xl pl-9 pr-8 text-xs bg-white border-slate-200"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-3" />
            </button>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatus('');
            }}
            className="h-8 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <X className="size-3 mr-1" /> Xóa bộ lọc
          </Button>
        ) : null}
      </div>

      {/* Table Container */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {query.isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <div className="p-6 text-center text-sm text-red-600">
            {getErrorMessage(query.error, 'Không thể tải danh sách thể loại.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Thể loại</th>
                  <th className="px-4 py-2.5">Slug</th>
                  <th className="px-4 py-2.5">Số game</th>
                  <th className="px-4 py-2.5">Thứ tự</th>
                  <th className="whitespace-nowrap px-4 py-2.5">Trạng thái</th>
                  <th className="px-4 py-2.5">Cập nhật</th>
                  <th className="px-4 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const canDelete = !item.isActive && item.usageCount === 0;
                  return (
                    <tr key={item.id} className="group transition duration-150 hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 text-xs">{item.name}</p>
                        <p className="mt-0.5 text-[11px] font-mono text-slate-400">{item.code}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.slug}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{item.usageCount} game</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{item.sortOrder}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              item.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                          {item.isActive ? 'Đang dùng' : 'Ngừng dùng'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(item)}
                            className="h-7 gap-1 px-2 text-xs font-semibold border-slate-200 bg-white hover:border-[#00873E]/40 hover:bg-[#E8F7EC] hover:text-[#00873E]"
                            aria-label={`Sửa ${item.name}`}
                          >
                            <Edit3 className="size-3" />
                            <span>Sửa</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canDelete || mutations.remove.isPending}
                            title={canDelete ? 'Xóa thể loại' : 'Chỉ xóa thể loại ngừng dùng chưa gắn game nào'}
                            className="h-7 px-2 text-xs font-semibold border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 disabled:opacity-35"
                            onClick={() => remove(item)}
                            aria-label={`Xóa ${item.name}`}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!items.length ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-slate-500">
                      {hasActiveFilters
                        ? 'Không tìm thấy thể loại nào phù hợp với bộ lọc hiện tại.'
                        : 'Chưa có thể loại nào được tạo.'}
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
  const isCreate = !editor.item;
  const [autoSlug, setAutoSlug] = useState(
    isCreate && (!editor.form.slug || editor.form.slug === slugify(editor.form.name)),
  );
  const [autoCode, setAutoCode] = useState(
    isCreate && (!editor.form.code || editor.form.code === codefy(editor.form.name)),
  );

  const set = <K extends keyof Form>(field: K, value: Form[K]) =>
    setEditor({ ...editor, form: { ...editor.form, [field]: value } });

  const handleNameChange = (val: string) => {
    const nextForm = { ...editor.form, name: val };
    if (isCreate) {
      if (autoSlug) {
        nextForm.slug = slugify(val);
      }
      if (autoCode) {
        nextForm.code = codefy(val);
      }
    }
    setEditor({ ...editor, form: nextForm });
  };

  const handleSlugChange = (val: string) => {
    setAutoSlug(false);
    set('slug', val.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleCodeChange = (val: string) => {
    setAutoCode(false);
    set('code', val.toUpperCase().replace(/[^A-Z0-9_]/g, ''));
  };

  const reSyncSlug = () => {
    setAutoSlug(true);
    set('slug', slugify(editor.form.name));
  };

  const reSyncCode = () => {
    setAutoCode(true);
    set('code', codefy(editor.form.name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            {editor.item ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}
          </h2>
          <button
            onClick={() => setEditor(null)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Đóng"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
          className="mt-4 space-y-3.5"
        >
          <Field label="Tên thể loại" required>
            <Input
              value={editor.form.name}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="VD: Nhập vai"
              autoFocus
              className="h-8.5 rounded-xl text-xs border-slate-200 focus-visible:ring-[#00873E]"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Slug" required>
              <Input
                value={editor.form.slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder="nhap-vai"
                className="h-8.5 rounded-xl text-xs font-mono border-slate-200 focus-visible:ring-[#00873E]"
              />
            </Field>

            <Field label="Mã thể loại (Code)" required>
              <Input
                value={editor.form.code}
                disabled={Boolean(editor.item)}
                onChange={(event) => handleCodeChange(event.target.value)}
                placeholder="NHAP_VAI"
                className="h-8.5 rounded-xl text-xs font-mono uppercase border-slate-200 focus-visible:ring-[#00873E]"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 items-center">
            <Field label="Thứ tự ưu tiên">
              <Input
                type="number"
                min={0}
                value={editor.form.sortOrder}
                onChange={(event) => set('sortOrder', event.target.value)}
                className="h-8.5 rounded-xl text-xs border-slate-200 focus-visible:ring-[#00873E]"
              />
            </Field>

            {editor.item ? (
              <div className="pt-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editor.form.isActive}
                    onChange={(event) => set('isActive', event.target.checked)}
                    className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
                  />
                  <span>Đang hoạt động</span>
                </label>
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditor(null)}
              disabled={pending}
              className="h-8.5 text-xs font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-8.5 text-xs font-semibold bg-[#00873E] hover:bg-[#007033] text-white gap-1.5 shadow-xs"
            >
              <Save className="size-3.5" /> {pending ? 'Đang lưu…' : 'Lưu thể loại'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 block text-xs font-semibold text-slate-700">
      <span>
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}


