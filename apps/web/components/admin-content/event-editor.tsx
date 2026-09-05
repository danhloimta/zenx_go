'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Maximize2,
  Minimize2,
  PenLine,
  RefreshCw,
  Save,
  Sparkles,
  SplitSquareVertical,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminContentEvent, ContentPublishStatus } from '@zenx-go/api-client';
import { useAdminContentEvent, useAdminContentGames } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { portalUrl } from '@/lib/domain';
import { formatDate } from '@/lib/utils';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/image-upload-field';
import { ArticleMarkdownPreview } from './article-markdown-preview';
import { MarkdownToolbar } from './markdown-toolbar';
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

type ViewMode = 'write' | 'preview' | 'split';

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
  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const canSubmit =
    form.title.trim().length >= 3 &&
    form.slug.trim().length >= 3 &&
    form.excerpt.trim().length >= 3 &&
    form.content.trim().length > 0 &&
    Boolean(form.startsAt);

  // Unsaved changes detection
  const isDirty = useMemo(() => {
    if (!initialized && editing) return false;
    const initial = editing && event ? toForm(event) : defaultForm();
    return JSON.stringify(form) !== JSON.stringify(initial);
  }, [form, initialized, editing, event]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (canSubmit && !pending) {
          if (editing) update.mutate();
          else create.mutate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canSubmit, pending, editing, update, create]);

  // Statistics
  const stats = useMemo(() => {
    const text = form.content.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, minutes };
  }, [form.content]);

  // Find linked game
  const selectedGame = useMemo(() => {
    return (games.data?.items ?? []).find((g) => g.id === form.gameId);
  }, [games.data?.items, form.gameId]);

  // Public live URL (all events are hosted on the portal at /events/:slug)
  const publicEventUrl = useMemo(() => {
    if (!form.slug) return null;
    return portalUrl(`/events/${form.slug}`);
  }, [form.slug]);

  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const copySlugToClipboard = () => {
    if (!form.slug) return;
    navigator.clipboard.writeText(publicEventUrl || `/events/${form.slug}`);
    setCopiedSlug(true);
    toast.success('Đã sao chép đường dẫn sự kiện');
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const copyIdToClipboard = () => {
    if (!eventId) return;
    navigator.clipboard.writeText(eventId);
    setCopiedId(true);
    toast.success('Đã sao chép ID sự kiện');
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Date validation notice
  const isDateInvalid = useMemo(() => {
    if (!form.startsAt || !form.endsAt) return false;
    return new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime();
  }, [form.startsAt, form.endsAt]);

  if (editing && eventQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-36 rounded-lg" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[600px] rounded-2xl lg:col-span-2" />
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
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

  return (
    <div className="space-y-6">
      {/* 1. Sticky Action Bar */}
      <header className="sticky top-0 z-30 -mx-4 -mt-6 border-b border-slate-200/90 bg-white/95 px-4 py-3.5 shadow-2xs backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Breadcrumb & Title */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/content/events"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
              title="Quay lại danh sách sự kiện"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Sự kiện</span>
                <span className="text-slate-300">/</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    form.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      form.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {form.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                </span>

                {isDirty ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Chưa lưu
                  </span>
                ) : editing ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Check className="size-3 text-emerald-500" />
                    Đã lưu
                  </span>
                ) : null}
              </div>

              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {form.title.trim() || (editing ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới')}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {publicEventUrl && form.status === 'PUBLISHED' ? (
              <a
                href={publicEventUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                title="Mở trang sự kiện trên website"
              >
                <ExternalLink className="size-3.5 text-slate-400" />
                <span>Xem trên web</span>
              </a>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/content/events')}
              className="border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Thoát
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={pending || !canSubmit}
              onClick={() => {
                if (editing) update.mutate();
                else create.mutate();
              }}
              className="gap-2 bg-[#00873E] px-4 text-xs font-bold text-white shadow-xs hover:bg-[#007033] disabled:opacity-50"
            >
              {pending ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Đang lưu…</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>{editing ? 'Lưu thay đổi' : 'Tạo sự kiện ngay'}</span>
                  <kbd className="hidden sm:inline-flex rounded bg-black/15 px-1 py-0.5 text-[10px] font-mono text-white/90">
                    ⌘S
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Form Grid */}
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          if (editing) update.mutate();
          else create.mutate();
        }}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT 2 COLUMNS: Content & Editor */}
          <div className="space-y-6 lg:col-span-2">
            {/* Card A: Basic Information */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    1. Thông tin sự kiện
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tiêu đề hiển thị, đường dẫn định danh URL và tóm tắt giới thiệu
                  </p>
                </div>
                <PenLine className="size-4 text-slate-400" />
              </div>

              <div className="mt-4 space-y-4">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="event-title" className="text-xs font-bold text-slate-700">
                      Tiêu đề sự kiện <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        form.title.length > 220 ? 'text-amber-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {form.title.length}/240
                    </span>
                  </div>
                  <Input
                    id="event-title"
                    value={form.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="Ví dụ: Đua Top Lực Chiến Mùa Hè Rực Lửa 2026..."
                    maxLength={240}
                    className="h-11 text-base font-semibold text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="event-slug" className="text-xs font-bold text-slate-700">
                      Đường dẫn định danh (URL Slug) <span className="text-rose-500">*</span>
                    </label>
                    {editing ? (
                      <span className="text-[11px] text-slate-400">
                        (Cố định để bảo vệ liên kết sự kiện)
                      </span>
                    ) : null}
                  </div>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 text-xs font-mono text-slate-400 truncate max-w-[140px] sm:max-w-none">
                      /events/
                    </span>
                    <Input
                      id="event-slug"
                      value={form.slug}
                      onChange={(event) => {
                        setAutoSlug(false);
                        set('slug', event.target.value);
                      }}
                      disabled={editing}
                      placeholder="dua-top-luc-chien-2026"
                      maxLength={180}
                      className="h-10 pl-20 pr-10 font-mono text-xs text-slate-700 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={copySlugToClipboard}
                      className="absolute right-2.5 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="Sao chép đường dẫn"
                    >
                      {copiedSlug ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="event-excerpt" className="text-xs font-bold text-slate-700">
                      Tóm tắt ngắn (Excerpt) <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        form.excerpt.length > 900 ? 'text-amber-600 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {form.excerpt.length}/1000
                    </span>
                  </div>
                  <Textarea
                    id="event-excerpt"
                    value={form.excerpt}
                    onChange={(event) => set('excerpt', event.target.value)}
                    placeholder="Tóm tắt ngắn gọn nội dung sự kiện, đối tượng áp dụng và phần thưởng nổi bật..."
                    className="min-h-20 text-sm leading-relaxed"
                    maxLength={1000}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Phần tóm tắt hiển thị trên banner trang chủ, danh sách sự kiện và thẻ xem trước mạng xã hội.
                  </p>
                </div>
              </div>
            </section>

            {/* Card B: Markdown Studio & Live Preview */}
            <section
              className={`rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-all ${
                isFullscreen
                  ? 'fixed inset-0 z-50 rounded-none border-0 p-4 sm:p-6 flex flex-col overflow-hidden bg-white'
                  : 'p-5 sm:p-6'
              }`}
            >
              {/* Studio Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-[#00873E]" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                    2. Chi tiết thể lệ & Nội dung sự kiện (Markdown Studio) <span className="text-rose-500">*</span>
                  </h2>
                </div>

                {/* View Mode Switcher & Stats */}
                <div className="flex items-center gap-2.5">
                  {/* Word / Reading Stats */}
                  <div className="hidden sm:flex items-center gap-2 rounded-lg bg-slate-100/80 px-2.5 py-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{stats.words} từ</span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      ~{stats.minutes} phút đọc
                    </span>
                  </div>

                  {/* Mode Tabs */}
                  <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setViewMode('write')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all ${
                        viewMode === 'write'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PenLine className="size-3" />
                      <span>Soạn thảo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('preview')}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all ${
                        viewMode === 'preview'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="size-3" />
                      <span>Xem trước</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('split')}
                      className={`hidden md:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all ${
                        viewMode === 'split'
                          ? 'bg-white text-slate-900 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <SplitSquareVertical className="size-3" />
                      <span>Chia đôi</span>
                    </button>
                  </div>

                  {/* Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    title={isFullscreen ? 'Thoát toàn màn hình' : 'Mở rộng toàn màn hình'}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="size-4" />
                    ) : (
                      <Maximize2 className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Toolbar & Editor Content */}
              <div
                className={`mt-4 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs ${
                  isFullscreen ? 'flex-1 flex flex-col min-h-0' : ''
                }`}
              >
                {/* Markdown Toolbar (Visible in write and split modes) */}
                {viewMode !== 'preview' ? (
                  <MarkdownToolbar
                    textareaRef={textareaRef}
                    value={form.content}
                    onChange={(val) => set('content', val)}
                  />
                ) : null}

                {/* Editor & Preview Area */}
                <div
                  className={`grid ${
                    viewMode === 'split'
                      ? 'md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200'
                      : 'grid-cols-1'
                  } ${isFullscreen ? 'flex-1 min-h-0' : ''}`}
                >
                  {/* Write Pane */}
                  {viewMode === 'write' || viewMode === 'split' ? (
                    <div className={`p-3 sm:p-4 ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
                      <textarea
                        ref={textareaRef}
                        aria-label="Nội dung Markdown"
                        value={form.content}
                        onChange={(event) => set('content', event.target.value)}
                        placeholder={`# Thể Lệ Sự Kiện\n\n### 1. Thời gian diễn ra\n- Bắt đầu: ...\n- Kết thúc: ...\n\n### 2. Thể lệ chi tiết\n- Đối tượng tham gia: Tất cả game thủ tại máy chủ...\n- Điều kiện nhận thưởng: ...\n\n### 3. Cơ cấu giải thưởng\n| Thứ hạng | Phần thưởng | Giá trị |\n| --- | --- | --- |\n| Top 1 | Thần Binh Huyền Thoại | 10.000 KNB |\n| Top 2-5 | Rương Trang Bị Tinh Anh | 5.000 KNB |`}
                        className={`w-full border-0 outline-none focus:outline-none focus:ring-0 resize-none font-mono text-sm leading-relaxed p-2 text-slate-800 placeholder:text-slate-400 ${
                          isFullscreen ? 'flex-1 min-h-0 h-full' : 'min-h-[500px]'
                        }`}
                        maxLength={50000}
                      />
                    </div>
                  ) : null}

                  {/* Preview Pane */}
                  {viewMode === 'preview' || viewMode === 'split' ? (
                    <div
                      className={`overflow-y-auto bg-slate-50/60 p-5 sm:p-7 ${
                        isFullscreen ? 'flex-1 min-h-0' : 'min-h-[500px] max-h-[750px]'
                      }`}
                    >
                      <ArticleMarkdownPreview content={form.content} />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400">
                <span>Hỗ trợ Markdown đầy đủ: # Tiêu đề, **In đậm**, [Link](url), ![Ảnh](url), Bảng biểu.</span>
                <span>{form.content.length.toLocaleString('vi-VN')} / 50.000 ký tự</span>
              </div>
            </section>

            {/* Card C: SEO Optimization & Google SERP Preview */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-[#00873E]" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      3. Tối ưu SEO & Hiển thị Google (Tùy chọn)
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Tùy chỉnh tiêu đề và mô tả xuất hiện trên công cụ tìm kiếm
                    </p>
                  </div>
                </div>
                <Sparkles className="size-4 text-amber-500" />
              </div>

              {/* Google SERP Preview Card Mockup */}
              <div className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Mô phỏng kết quả tìm kiếm Google (Google SERP Snippet)
                </p>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs font-sans">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="flex size-4.5 items-center justify-center rounded-full bg-[#00873E] text-[10px] font-black text-white">
                      Z
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="text-xs font-medium text-slate-800">ZenX Gaming Portal</span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {publicEventUrl || `https://zenxgo.io.vn/events/${form.slug || 'slug-su-kien'}`}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                    {form.seoTitle.trim() || form.title.trim() || 'Tiêu đề sự kiện xuất hiện trên kết quả Google'}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#4d5156] line-clamp-2">
                    {form.seoDescription.trim() ||
                      form.excerpt.trim() ||
                      'Mô tả chi tiết sự kiện, thời gian diễn ra và phần thưởng hấp dẫn giúp thu hút game thủ tham gia...'}
                  </p>
                </div>
              </div>

              {/* SEO Inputs */}
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="seo-title" className="text-xs font-bold text-slate-700">
                      SEO Title
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        form.seoTitle.length >= 40 && form.seoTitle.length <= 65
                          ? 'text-emerald-600 font-bold'
                          : form.seoTitle.length > 65
                          ? 'text-rose-500 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {form.seoTitle.length}/60 ký tự khuyến nghị
                    </span>
                  </div>
                  <Input
                    id="seo-title"
                    value={form.seoTitle}
                    onChange={(event) => set('seoTitle', event.target.value)}
                    placeholder="Mặc định lấy theo Tiêu đề sự kiện nếu để trống..."
                    maxLength={240}
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="seo-description" className="text-xs font-bold text-slate-700">
                      SEO Meta Description
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        form.seoDescription.length >= 120 && form.seoDescription.length <= 165
                          ? 'text-emerald-600 font-bold'
                          : form.seoDescription.length > 165
                          ? 'text-rose-500 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {form.seoDescription.length}/160 ký tự khuyến nghị
                    </span>
                  </div>
                  <Textarea
                    id="seo-description"
                    value={form.seoDescription}
                    onChange={(event) => set('seoDescription', event.target.value)}
                    placeholder="Mặc định lấy theo Tóm tắt Excerpt nếu để trống..."
                    className="min-h-20 text-xs leading-relaxed"
                    maxLength={500}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT 1 COLUMN: Sidebar & Settings */}
          <div className="space-y-6">
            {/* Card 1: Publish Status & Scope */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Xuất bản & Phạm vi
              </h2>

              <div className="mt-4 space-y-4">
                {/* Status Segmented Control */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    Trạng thái sự kiện
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => set('status', 'DRAFT')}
                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all ${
                        form.status === 'DRAFT'
                          ? 'border-amber-400 bg-amber-50/70 text-amber-900 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <FileText
                        className={`size-4.5 ${
                          form.status === 'DRAFT' ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="mt-1 text-xs">Bản nháp</span>
                      <span className="text-[10px] text-slate-400 font-normal">Chưa công khai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => set('status', 'PUBLISHED')}
                      className={`flex flex-col items-center justify-center rounded-xl p-3 text-center border transition-all ${
                        form.status === 'PUBLISHED'
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Globe
                        className={`size-4.5 ${
                          form.status === 'PUBLISHED' ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="mt-1 text-xs">Xuất bản</span>
                      <span className="text-[10px] text-slate-400 font-normal">Hiển thị công khai</span>
                    </button>
                  </div>
                </div>

                {/* Linked Game / Portal Scope */}
                <div>
                  <label htmlFor="event-game" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Phạm vi áp dụng
                  </label>
                  <Select
                    id="event-game"
                    value={form.gameId}
                    onChange={(event) => set('gameId', event.target.value)}
                    className="h-10 text-sm font-medium"
                  >
                    <option value="">Áp dụng toàn Portal (Tất cả game)</option>
                    {(games.data?.items ?? []).map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name} ({game.code})
                      </option>
                    ))}
                  </Select>
                  {selectedGame ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                        {selectedGame.subdomain}
                      </span>
                      <span>Subdomain cổng game</span>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Sự kiện sẽ hiển thị trên trang chủ chung của toàn hệ thống Portal.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Card 2: Timeline Schedule */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <CalendarDays className="size-4 text-[#00873E]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Lịch trình diễn ra
                </h2>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="event-starts-at" className="text-xs font-bold text-slate-700">
                      Thời gian bắt đầu <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <Input
                    id="event-starts-at"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) => set('startsAt', event.target.value)}
                    className="h-10 text-xs font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Thời điểm sự kiện chính thức mở cổng tham gia.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="event-ends-at" className="text-xs font-bold text-slate-700">
                      Thời gian kết thúc (Tùy chọn)
                    </label>
                  </div>
                  <Input
                    id="event-ends-at"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(event) => set('endsAt', event.target.value)}
                    className="h-10 text-xs font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Để trống nếu là sự kiện vô thời hạn hoặc dài hạn.
                  </p>
                </div>

                {isDateInvalid ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-700">
                    <span className="font-bold">Lưu ý:</span> Thời gian kết thúc đang diễn ra trước hoặc trùng thời gian bắt đầu sự kiện.
                  </div>
                ) : null}
              </div>
            </section>

            {/* Card 3: Cover Image */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Ảnh banner sự kiện (Cover Image)
              </h2>
              <div className="mt-4">
                <ImageUploadField
                  label="Tải lên banner tỷ lệ 16:9"
                  value={form.coverImageUrl}
                  onChange={(val) => set('coverImageUrl', val)}
                  aspectRatio="16:9"
                  placeholder="/uploads/content/... hoặc https://..."
                  hint="Tỷ lệ khuyến nghị 16:9 (1280x720 hoặc 1920x1080). Tối đa 5MB."
                  modalTitle="Cắt & Chỉnh sửa banner sự kiện"
                />
              </div>
            </section>

            {/* Card 4: Metadata & Timestamps */}
            {editing && event ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                  Thông tin lưu trữ
                </h2>
                <dl className="mt-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Mã sự kiện (ID):</dt>
                    <dd className="flex items-center gap-1 font-mono font-bold text-slate-700">
                      <span>{event.id.slice(0, 8)}…</span>
                      <button
                        type="button"
                        onClick={copyIdToClipboard}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        title="Sao chép toàn bộ ID"
                      >
                        {copiedId ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Ngày tạo:</dt>
                    <dd className="flex items-center gap-1 font-medium text-slate-700">
                      <Calendar className="size-3 text-slate-400" />
                      {formatDate(event.createdAt)}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Cập nhật lần cuối:</dt>
                    <dd className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="size-3 text-slate-400" />
                      {formatDate(event.updatedAt)}
                    </dd>
                  </div>
                </dl>
              </section>
            ) : null}

            {/* Save Card for Mobile */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:hidden">
              <Button
                type="submit"
                disabled={pending || !canSubmit}
                className="w-full h-11 gap-2 bg-[#00873E] font-bold text-white hover:bg-[#007033]"
              >
                <Save className="size-4" />
                {pending ? 'Đang lưu sự kiện…' : editing ? 'Lưu thay đổi' : 'Tạo sự kiện ngay'}
              </Button>
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
