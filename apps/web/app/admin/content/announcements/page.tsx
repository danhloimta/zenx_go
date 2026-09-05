'use client';

import {
  Calendar,
  Edit3,
  Megaphone,
  Plus,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminContentAnnouncement, ContentPublishStatus } from '@zenx-go/api-client';
import { useAdminContentAnnouncements } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type Form = {
  code: string;
  title: string;
  message: string;
  ctaLabel: string;
  ctaPath: string;
  status: ContentPublishStatus;
  startsAt: string;
  endsAt: string;
  sortOrder: string;
};

export default function AdminContentAnnouncementsPage() {
  const queryClient = useQueryClient();
  const query = useAdminContentAnnouncements({});
  const [editing, setEditing] = useState<AdminContentAnnouncement | null | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<'' | ContentPublishStatus>('');
  const [search, setSearch] = useState('');

  const create = useMutation({
    mutationFn: (form: Form) => api.admin.content.createAnnouncement(toCreate(form)),
    onSuccess: () => {
      toast.success('Đã tạo thông báo thành công.');
      setEditing(undefined);
      invalidate(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const update = useMutation({
    mutationFn: ({ item, form }: { item: AdminContentAnnouncement; form: Form }) =>
      api.admin.content.updateAnnouncement(item.id, toUpdate(item, form)),
    onSuccess: () => {
      toast.success('Đã lưu thông báo thành công.');
      setEditing(undefined);
      invalidate(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const allItems = query.data?.items ?? [];

  // Filtered items
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (filterStatus && item.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchMsg = item.message.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchMsg) return false;
      }
      return true;
    });
  }, [allItems, filterStatus, search]);

  // Quick stats
  const now = new Date().getTime();
  const activeCount = useMemo(() => {
    return allItems.filter((item) => {
      if (item.status !== 'PUBLISHED') return false;
      const start = new Date(item.startsAt).getTime();
      const end = item.endsAt ? new Date(item.endsAt).getTime() : null;
      return start <= now && (end === null || end >= now);
    }).length;
  }, [allItems, now]);

  const publishedCount = allItems.filter((i) => i.status === 'PUBLISHED').length;
  const draftCount = allItems.filter((i) => i.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-100/80 bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-white p-6 sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-800">
                <Megaphone className="size-3.5" /> Content CMS
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {allItems.length} thông báo
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Ribbon Thông báo Portal
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Quản lý các thanh thông báo khẩn cấp, bảo trì, ưu đãi hoặc sự kiện nổi bật ghim trên đầu trang web.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
              disabled={query.isFetching}
              className="gap-2 bg-white"
            >
              <RefreshCw className={`size-3.5 ${query.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button
              size="sm"
              onClick={() => setEditing(null)}
              className="gap-2 bg-[#00873E] text-white hover:bg-[#007033]"
            >
              <Plus className="size-4" /> Tạo thông báo mới
            </Button>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Tổng thông báo</div>
            <div className="mt-1 text-xl font-black text-slate-900">{allItems.length}</div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Đang ghim hiển thị</div>
            <div className="mt-1 flex items-center gap-1.5 text-xl font-black text-amber-600">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              {activeCount}
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Đã xuất bản</div>
            <div className="mt-1 text-xl font-black text-emerald-600">{publishedCount}</div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Bản nháp</div>
            <div className="mt-1 text-xl font-black text-slate-600">{draftCount}</div>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, mã code, thông điệp…"
                className="h-10 text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as '' | ContentPublishStatus)}
              className="h-10 w-44 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="DRAFT">Bản nháp</option>
            </Select>

            {(search || filterStatus) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('');
                }}
                className="text-xs text-rose-600 hover:bg-rose-50"
              >
                Xóa lọc
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Announcements List */}
      {query.isLoading ? (
        <AnnouncementSkeleton />
      ) : query.isError || !query.data ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
          <p className="font-bold">Không thể tải danh sách thông báo.</p>
          <p className="mt-1 text-xs text-rose-600">
            Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Megaphone className="size-7" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">Chưa có thông báo nào</h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500">
            {search || filterStatus
              ? 'Không tìm thấy thông báo khớp với điều kiện tìm kiếm.'
              : 'Tạo thông báo ghim để thông báo tin tức nóng, bảo trì đến toàn bộ người chơi.'}
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              size="sm"
              onClick={() => setEditing(null)}
              className="bg-[#00873E] text-white hover:bg-[#007033]"
            >
              <Plus className="size-4" /> Tạo thông báo đầu tiên
            </Button>
          </div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const start = new Date(item.startsAt).getTime();
              const end = item.endsAt ? new Date(item.endsAt).getTime() : null;
              const isCurrentlyActive =
                item.status === 'PUBLISHED' && start <= now && (end === null || end >= now);

              return (
                <div
                  key={item.id}
                  className="group flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 gap-4">
                    <div
                      className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                        isCurrentlyActive
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Megaphone className="size-5" />
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#00873E]">
                          {item.code}
                        </span>
                        <StatusBadge status={item.status} />
                        {isCurrentlyActive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Đang ghim hiển thị
                          </span>
                        )}
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          Thứ tự ưu tiên: {item.sortOrder}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.message}</p>

                      {/* CTA preview if available */}
                      {item.ctaLabel && (
                        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                          <span className="text-[11px] text-slate-400">Nút bấm:</span>
                          <span className="font-bold text-[#00873E]">{item.ctaLabel}</span>
                          <span className="text-[11px] text-slate-400">({item.ctaPath || '/'})</span>
                        </div>
                      )}

                      {/* Schedule info */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> Bắt đầu: {formatDate(item.startsAt)}
                        </span>
                        <span>•</span>
                        <span>
                          {item.endsAt ? `Kết thúc: ${formatDate(item.endsAt)}` : 'Không giới hạn thời gian'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2 sm:self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(item)}
                      className="gap-1.5 rounded-xl border-slate-200 text-xs font-bold text-slate-700 hover:bg-[#00873E]/10 hover:text-[#00873E]"
                    >
                      <Edit3 className="size-3.5" /> Chỉnh sửa
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal Dialog for Create/Edit */}
      {editing !== undefined ? (
        <AnnouncementDialog
          item={editing}
          pending={create.isPending || update.isPending}
          onClose={() => setEditing(undefined)}
          onSubmit={(form) =>
            editing ? update.mutate({ item: editing, form }) : create.mutate(form)
          }
        />
      ) : null}
    </div>
  );
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'announcements'] });
  void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
}

function toInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toApi(value: string) {
  return new Date(value).toISOString();
}

function toForm(item: AdminContentAnnouncement | null): Form {
  return item
    ? {
        code: item.code,
        title: item.title,
        message: item.message,
        ctaLabel: item.ctaLabel ?? '',
        ctaPath: item.ctaPath ?? '',
        status: item.status,
        startsAt: toInput(item.startsAt),
        endsAt: toInput(item.endsAt),
        sortOrder: String(item.sortOrder),
      }
    : {
        code: '',
        title: '',
        message: '',
        ctaLabel: '',
        ctaPath: '',
        status: 'DRAFT',
        startsAt: toInput(new Date().toISOString()),
        endsAt: '',
        sortOrder: '0',
      };
}

function toCreate(form: Form) {
  return {
    code: form.code,
    title: form.title,
    message: form.message,
    ctaLabel: form.ctaLabel || null,
    ctaPath: form.ctaPath || null,
    status: form.status,
    startsAt: toApi(form.startsAt),
    endsAt: form.endsAt ? toApi(form.endsAt) : null,
    sortOrder: Number(form.sortOrder) || 0,
  };
}

function toUpdate(item: AdminContentAnnouncement, form: Form) {
  return {
    title: form.title,
    message: form.message,
    ctaLabel: form.ctaLabel || null,
    ctaPath: form.ctaPath || null,
    status: form.status,
    startsAt: toApi(form.startsAt),
    endsAt: form.endsAt ? toApi(form.endsAt) : null,
    sortOrder: Number(form.sortOrder) || 0,
    expectedUpdatedAt: item.updatedAt,
  };
}

function StatusBadge({ status }: { status: ContentPublishStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
        status === 'PUBLISHED'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'
      }`}
    >
      {status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
    </span>
  );
}

function AnnouncementDialog({
  item,
  pending,
  onClose,
  onSubmit,
}: {
  item: AdminContentAnnouncement | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: (form: Form) => void;
}) {
  const [form, setForm] = useState(() => toForm(item));
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const canSubmit =
    form.title.trim().length >= 2 &&
    form.message.trim().length > 0 &&
    Boolean(form.startsAt) &&
    (Boolean(item) || form.code.trim().length >= 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-[#00873E]">Ribbon Thông báo</span>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {item ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Thông báo sẽ hiển thị trên dải banner trang chủ trong khoảng thời gian đã định.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form body */}
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Mã định danh (Code) (*)"
              hint={item ? 'Code không thể thay đổi sau khi tạo' : 'Ví dụ: MAINTENANCE_SEPT, PROMO_LUNAR'}
            >
              <Input
                value={form.code}
                onChange={(event) => set('code', event.target.value.toUpperCase())}
                disabled={Boolean(item)}
                placeholder="PROMO_FALL_2026"
                className="font-mono text-xs uppercase"
              />
            </Field>

            <Field label="Trạng thái">
              <Select
                value={form.status}
                onChange={(event) => set('status', event.target.value as ContentPublishStatus)}
                className="h-10 text-xs font-bold"
              >
                <option value="DRAFT">📝 Bản nháp</option>
                <option value="PUBLISHED">🚀 Đã xuất bản (Công khai)</option>
              </Select>
            </Field>
          </div>

          <Field label="Tiêu đề thông báo (*)">
            <Input
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              placeholder="Ví dụ: Lịch bảo trì định kỳ máy chủ ngày 10/09"
              className="font-semibold"
            />
          </Field>

          <Field label="Nội dung thông điệp (*)">
            <Textarea
              value={form.message}
              onChange={(event) => set('message', event.target.value)}
              placeholder="Nhập thông điệp ngắn gọn hiển thị trên banner..."
              className="min-h-24 text-sm leading-relaxed"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Thứ tự ưu tiên" hint="Số nhỏ hơn hiển thị trước">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(event) => set('sortOrder', event.target.value)}
              />
            </Field>

            <Field label="Nút bấm (CTA Label)" hint="Tùy chọn">
              <Input
                value={form.ctaLabel}
                onChange={(event) => set('ctaLabel', event.target.value)}
                placeholder="Xem chi tiết"
              />
            </Field>

            <Field label="Đường dẫn (CTA Path)" hint="Tùy chọn">
              <Input
                value={form.ctaPath}
                onChange={(event) => set('ctaPath', event.target.value)}
                placeholder="/events/bao-tri"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bắt đầu hiển thị (*)">
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) => set('startsAt', event.target.value)}
                className="text-xs"
              />
            </Field>

            <Field label="Kết thúc hiển thị" hint="Để trống nếu không giới hạn">
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) => set('endsAt', event.target.value)}
                className="text-xs"
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl text-xs">
            Hủy bỏ
          </Button>
          <Button
            disabled={pending || !canSubmit}
            onClick={() => onSubmit(form)}
            className="gap-1.5 rounded-xl bg-[#00873E] text-xs font-bold text-white hover:bg-[#007033]"
          >
            <Save className="size-4" /> {pending ? 'Đang lưu…' : item ? 'Lưu thay đổi' : 'Tạo thông báo'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function AnnouncementSkeleton() {
  return (
    <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-10 w-full rounded-2xl" />
      {[1, 2, 3, 4].map((value) => (
        <div key={value} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-11 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
