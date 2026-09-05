'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Globe,
  Save,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminContentEvent, ContentPublishStatus } from '@zenx-go/api-client';
import { useAdminContentEvent, useAdminContentGames } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { SupportMarkdown } from '@/components/support-markdown';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/image-upload-field';
import { toast } from 'sonner';

type EventForm = {
  gameId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  startsAt: string;
  endsAt: string;
  seoTitle: string;
  seoDescription: string;
  status: ContentPublishStatus;
};

export function EventEditor({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(eventId);
  const eventQuery = useAdminContentEvent(eventId ?? '', editing);
  const games = useAdminContentGames({ page: 1, pageSize: 50 });
  const event = eventQuery.data;
  const [form, setForm] = useState<EventForm>(() => defaultForm());
  const [initialized, setInitialized] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!editing);

  useEffect(() => {
    if (event && !initialized) {
      setForm(toForm(event));
      setInitialized(true);
      setAutoSlug(false);
    }
  }, [event, initialized]);

  const handleTitleChange = (val: string) => {
    setForm((current) => {
      const next = { ...current, title: val };
      if (autoSlug && !editing) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const create = useMutation({
    mutationFn: () => api.admin.content.createEvent(toRequest(form)),
    onSuccess: () => {
      toast.success('Đã tạo sự kiện thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'events'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
      router.push('/admin/content/events');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const update = useMutation({
    mutationFn: () =>
      api.admin.content.updateEvent(eventId!, {
        gameId: form.gameId || null,
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImageUrl: form.coverImageUrl || null,
        startsAt: toApiDate(form.startsAt),
        endsAt: form.endsAt ? toApiDate(form.endsAt) : null,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        status: form.status,
        expectedUpdatedAt: event!.updatedAt,
      }),
    onSuccess: () => {
      toast.success('Đã lưu sự kiện thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'event', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'events'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const pending = create.isPending || update.isPending;

  if (editing && eventQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-20 w-full rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (editing && (eventQuery.isError || !event)) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>{getErrorMessage(eventQuery.error, 'Không thể tải dữ liệu sự kiện.')}</Alert>
      </div>
    );
  }

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const canSubmit =
    form.title.trim().length >= 3 &&
    form.slug.trim().length >= 3 &&
    form.excerpt.trim().length >= 3 &&
    form.content.trim().length > 0 &&
    Boolean(form.startsAt);

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/70 bg-gradient-to-r from-emerald-500/10 via-emerald-50/50 to-white p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00873E]/10 px-3 py-1 text-xs font-bold text-[#00873E]">
                <CalendarDays className="size-3.5" /> {editing ? 'Biên tập sự kiện' : 'Tạo sự kiện mới'}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  form.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {form.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {editing ? form.title || 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {editing
                ? 'Cập nhật thời gian diễn ra, ảnh bìa banner và nội dung chi tiết sự kiện.'
                : 'Thiết lập sự kiện áp dụng cho từng game hoặc toàn hệ thống portal.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/content/events')}
              className="bg-white text-xs"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={pending || !canSubmit}
              onClick={() => {
                if (editing) update.mutate();
                else create.mutate();
              }}
              className="gap-1.5 bg-[#00873E] text-xs font-bold text-white hover:bg-[#007033]"
            >
              <Save className="size-3.5" />
              {pending ? 'Đang lưu…' : editing ? 'Lưu sự kiện' : 'Tạo sự kiện ngay'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form Layout */}
      <form
        className="space-y-6"
        onSubmit={(submitEvent) => {
          submitEvent.preventDefault();
          if (!canSubmit) return;
          if (editing) update.mutate();
          else create.mutate();
        }}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left 2 Cols */}
          <div className="space-y-6 lg:col-span-2">
            {/* General Info */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-base font-black text-slate-900">Thông tin sự kiện</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Tiêu đề hiển thị, đường dẫn slug và mô tả tóm tắt.
              </p>

              <div className="mt-5 space-y-4">
                <Field label="Tiêu đề sự kiện (*)">
                  <Input
                    value={form.title}
                    onChange={(input) => handleTitleChange(input.target.value)}
                    placeholder="Ví dụ: Đua Top Lực Chiến Mùa Hè Rực Lửa 2026"
                    maxLength={240}
                    className="h-11 font-semibold text-slate-900"
                  />
                </Field>

                <Field
                  label="URL Slug (*)"
                  hint={
                    editing
                      ? 'Slug được gán cố định khi tạo để bảo toàn liên kết SEO.'
                      : 'Định danh thân thiện trên đường dẫn web.'
                  }
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                      /events/
                    </span>
                    <Input
                      value={form.slug}
                      onChange={(input) => {
                        setAutoSlug(false);
                        set('slug', input.target.value);
                      }}
                      disabled={editing}
                      placeholder="dua-top-luc-chien-2026"
                      maxLength={180}
                      className="h-10 pl-18 font-mono text-xs disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </Field>

                <Field
                  label="Tóm tắt ngắn (Excerpt) (*)"
                  hint="Hiển thị trên banner sự kiện và danh sách tổng quan."
                >
                  <Textarea
                    value={form.excerpt}
                    onChange={(input) => set('excerpt', input.target.value)}
                    placeholder="Tóm tắt nội dung sự kiện, phần thưởng hấp dẫn..."
                    className="min-h-24 text-sm"
                    maxLength={1000}
                  />
                </Field>
              </div>
            </section>

            {/* Markdown Content & Preview */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-[#00873E]" />
                    <h2 className="text-base font-black text-slate-900">Chi tiết thể lệ & Nội dung Markdown (*)</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Trình bày thể lệ tham gia, mốc phần thưởng, hướng dẫn nhận quà.
                  </p>
                </div>
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-mono text-slate-600">
                  {form.content.length} ký tự
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div>
                  <span className="mb-2 block text-xs font-bold text-slate-700">Trình soạn thảo</span>
                  <Textarea
                    aria-label="Nội dung Markdown"
                    value={form.content}
                    onChange={(input) => set('content', input.target.value)}
                    className="min-h-[480px] font-mono text-sm leading-relaxed"
                    placeholder={`# Thể Lệ Sự Kiện\n\n### 1. Thời gian diễn ra\nTừ ngày... đến ngày...\n\n### 2. Thể lệ chi tiết\n- Đối tượng tham gia...\n- Điều kiện nhận thưởng...\n\n### 3. Cơ cấu giải thưởng\n- Top 1: ...\n- Top 2-5: ...`}
                    maxLength={50000}
                  />
                </div>

                <div>
                  <span className="mb-2 block text-xs font-bold text-slate-700">Xem trước (Live Preview)</span>
                  <div className="min-h-[480px] max-h-[550px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-sm leading-7 shadow-2xs">
                    {form.content ? (
                      <SupportMarkdown>{form.content}</SupportMarkdown>
                    ) : (
                      <p className="text-xs italic text-slate-400">
                        Chưa có nội dung xem trước. Hãy nhập Markdown ở khung bên trái.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SEO Section */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-[#00873E]" />
                <h2 className="text-base font-black text-slate-900">Cấu hình SEO (Tùy chọn)</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Tối ưu hóa thẻ chia sẻ và công cụ tìm kiếm.
              </p>

              <div className="mt-5 space-y-4">
                <Field label="SEO Title">
                  <Input
                    value={form.seoTitle}
                    onChange={(input) => set('seoTitle', input.target.value)}
                    placeholder="Mặc định lấy theo tiêu đề sự kiện nếu để trống"
                    maxLength={240}
                  />
                </Field>

                <Field label="SEO Description">
                  <Textarea
                    value={form.seoDescription}
                    onChange={(input) => set('seoDescription', input.target.value)}
                    placeholder="Mặc định lấy theo tóm tắt Excerpt nếu để trống..."
                    className="min-h-20 text-xs"
                    maxLength={500}
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* Right Col: Scope, Timeline & Banner Upload */}
          <div className="space-y-6">
            {/* Timeline & Scope */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <h3 className="font-black text-slate-900">Thiết lập & Lịch trình</h3>

              <div className="mt-5 space-y-4">
                <Field label="Trạng thái sự kiện">
                  <Select
                    value={form.status}
                    onChange={(input) => set('status', input.target.value as ContentPublishStatus)}
                    className="h-10 text-sm font-semibold"
                  >
                    <option value="DRAFT">📝 Bản nháp (Chưa công khai)</option>
                    <option value="PUBLISHED">🚀 Đã xuất bản (Công khai)</option>
                  </Select>
                </Field>

                <Field
                  label="Phạm vi áp dụng"
                  hint="Chọn tựa game cụ thể hoặc để toàn portal"
                >
                  <Select
                    value={form.gameId}
                    onChange={(input) => set('gameId', input.target.value)}
                    className="h-10 text-sm"
                  >
                    <option value="">🌐 Áp dụng toàn Portal</option>
                    {(games.data?.items ?? []).map((game) => (
                      <option key={game.id} value={game.id}>
                        🎮 {game.name} ({game.code})
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Thời gian bắt đầu (*)">
                    <Input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(input) => set('startsAt', input.target.value)}
                      className="h-10 text-xs"
                    />
                  </Field>

                  <Field label="Thời gian kết thúc (Tùy chọn)">
                    <Input
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(input) => set('endsAt', input.target.value)}
                      className="h-10 text-xs"
                    />
                  </Field>
                </div>

                {/* Banner Upload with 16:9 crop tool */}
                <div className="border-t border-slate-100 pt-4">
                  <ImageUploadField
                    label="Ảnh banner sự kiện (Cover Image)"
                    value={form.coverImageUrl}
                    onChange={(val) => set('coverImageUrl', val)}
                    aspectRatio="16:9"
                    placeholder="/uploads/content/... hoặc https://..."
                    hint="Tải lên máy chủ hoặc cắt theo tỷ lệ chuẩn 16:9."
                    modalTitle="Cắt & Chỉnh sửa banner sự kiện"
                  />
                </div>
              </div>
            </section>

            {/* Submit Card */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={pending || !canSubmit}
                  className="w-full h-11 gap-2 bg-[#00873E] font-bold text-white hover:bg-[#007033]"
                >
                  <Save className="size-4" />
                  {pending ? 'Đang lưu sự kiện…' : editing ? 'Lưu thay đổi' : 'Tạo sự kiện ngay'}
                </Button>

                {!canSubmit && (
                  <p className="text-center text-[11px] text-amber-600">
                    * Vui lòng nhập Tiêu đề, Slug, Excerpt, Thời gian bắt đầu và Nội dung chi tiết.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function defaultForm(): EventForm {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    gameId: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    startsAt: toInputDate(new Date().toISOString()),
    endsAt: toInputDate(tomorrow.toISOString()),
    seoTitle: '',
    seoDescription: '',
    status: 'DRAFT',
  };
}

function toForm(event: AdminContentEvent): EventForm {
  return {
    gameId: event.gameId ?? '',
    title: event.title,
    slug: event.slug,
    excerpt: event.excerpt,
    content: event.content ?? '',
    coverImageUrl: event.coverImageUrl ?? '',
    startsAt: toInputDate(event.startsAt),
    endsAt: event.endsAt ? toInputDate(event.endsAt) : '',
    seoTitle: event.seoTitle ?? '',
    seoDescription: event.seoDescription ?? '',
    status: event.status,
  };
}

function toRequest(form: EventForm) {
  return {
    gameId: form.gameId || null,
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    content: form.content,
    coverImageUrl: form.coverImageUrl || null,
    startsAt: toApiDate(form.startsAt),
    endsAt: form.endsAt ? toApiDate(form.endsAt) : null,
    seoTitle: form.seoTitle || null,
    seoDescription: form.seoDescription || null,
    status: form.status,
  };
}

function toInputDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function toApiDate(value: string) {
  return new Date(value).toISOString();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function BackLink() {
  return (
    <Link
      href="/admin/content/events"
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
    >
      <ArrowLeft className="size-4" /> Quay lại danh sách sự kiện
    </Link>
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
