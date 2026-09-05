'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
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
import type {
  AdminContentArticle,
  ContentPublishStatus,
  GameArticleCategory,
} from '@zenx-go/api-client';
import { useAdminContentArticle, useAdminContentGames } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { gameUrl } from '@/lib/domain';
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

const categoryOptions: Array<{
  value: GameArticleCategory;
  label: string;
  desc: string;
  badgeColor: string;
}> = [
  {
    value: 'DEVELOPMENT_UPDATE',
    label: 'Cập nhật phát triển',
    desc: 'Bản vá (patch notes), tính năng mới, lộ trình',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    value: 'ANNOUNCEMENT',
    label: 'Thông báo',
    desc: 'Thông báo chung từ ban quản trị, tin cộng đồng',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    value: 'EVENT',
    label: 'Sự kiện',
    desc: 'Sự kiện in-game, đua top, minigame nhận quà',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    value: 'MAINTENANCE',
    label: 'Bảo trì hệ thống',
    desc: 'Lịch bảo trì máy chủ, downtime, nâng cấp hạ tầng',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
];

type ArticleForm = {
  gameId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: GameArticleCategory;
  seoTitle: string;
  seoDescription: string;
  status: ContentPublishStatus;
};

type ViewMode = 'write' | 'preview' | 'split';

export function ArticleEditor({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(articleId);
  const articleQuery = useAdminContentArticle(articleId ?? '', editing);
  const games = useAdminContentGames({ page: 1, pageSize: 50 });
  const article = articleQuery.data;

  const [form, setForm] = useState<ArticleForm>(() => defaultForm());
  const [initialized, setInitialized] = useState(false);
  const [autoSlug, setAutoSlug] = useState(!editing);
  const [viewMode, setViewMode] = useState<ViewMode>('write');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (article && !initialized) {
      setForm(toForm(article));
      setInitialized(true);
      setAutoSlug(false);
    }
  }, [article, initialized]);

  // Handle auto slug from title if creating
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
    mutationFn: () =>
      api.admin.content.createArticle({ ...form, coverImageUrl: form.coverImageUrl || null }),
    onSuccess: () => {
      toast.success('Đã tạo bài viết thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'articles'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
      router.push('/admin/content/articles');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const update = useMutation({
    mutationFn: () =>
      api.admin.content.updateArticle(articleId!, {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImageUrl: form.coverImageUrl || null,
        category: form.category,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
        status: form.status,
        expectedUpdatedAt: article!.updatedAt,
      }),
    onSuccess: () => {
      toast.success('Đã lưu bài viết thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'article', articleId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'articles'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const pending = create.isPending || update.isPending;

  const canSubmit =
    Boolean(form.gameId) &&
    form.title.trim().length >= 3 &&
    form.slug.trim().length >= 3 &&
    form.excerpt.trim().length >= 3 &&
    form.content.trim().length > 0;

  // Unsaved changes detection
  const isDirty = useMemo(() => {
    if (!initialized && editing) return false;
    const initial = editing && article ? toForm(article) : defaultForm();
    return JSON.stringify(form) !== JSON.stringify(initial);
  }, [form, initialized, editing, article]);

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

  // Public live URL
  const publicArticleUrl = useMemo(() => {
    if (!selectedGame?.subdomain || !form.slug) return null;
    return gameUrl(selectedGame.subdomain, `/tin-tuc/${form.slug}`);
  }, [selectedGame?.subdomain, form.slug]);

  const set = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const copySlugToClipboard = () => {
    if (!form.slug) return;
    navigator.clipboard.writeText(publicArticleUrl || `/tin-tuc/${form.slug}`);
    setCopiedSlug(true);
    toast.success('Đã sao chép đường dẫn bài viết');
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const copyIdToClipboard = () => {
    if (!articleId) return;
    navigator.clipboard.writeText(articleId);
    setCopiedId(true);
    toast.success('Đã sao chép ID bài viết');
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (editing && articleQuery.isLoading) {
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

  if (editing && (articleQuery.isError || !article)) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>{getErrorMessage(articleQuery.error, 'Không thể tải dữ liệu bài viết.')}</Alert>
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
              href="/admin/content/articles"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
              title="Quay lại danh sách bài viết"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Bài viết</span>
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
                {form.title.trim() || (editing ? 'Chỉnh sửa bài viết' : 'Soạn thảo bài viết mới')}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {publicArticleUrl && form.status === 'PUBLISHED' ? (
              <a
                href={publicArticleUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
                title="Mở bài viết thực tế trên website game"
              >
                <ExternalLink className="size-3.5 text-slate-400" />
                <span>Xem trên web</span>
              </a>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/content/articles')}
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
                  <span>{editing ? 'Lưu thay đổi' : 'Tạo & Xuất bản'}</span>
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
        onSubmit={(event) => {
          event.preventDefault();
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
                    1. Thông tin cơ bản
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Tiêu đề chính, định danh URL và tóm tắt hiển thị
                  </p>
                </div>
                <PenLine className="size-4 text-slate-400" />
              </div>

              <div className="mt-4 space-y-4">
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="article-title" className="text-xs font-bold text-slate-700">
                      Tiêu đề bài viết <span className="text-rose-500">*</span>
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
                    id="article-title"
                    value={form.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="Nhập tiêu đề bài viết cuốn hút (ví dụ: Bản cập nhật 1.2: Vùng đất bí ẩn)..."
                    maxLength={240}
                    className="h-11 text-base font-semibold text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {/* Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="article-slug" className="text-xs font-bold text-slate-700">
                      Đường dẫn định danh (URL Slug) <span className="text-rose-500">*</span>
                    </label>
                    {editing ? (
                      <span className="text-[11px] text-slate-400">
                        (Cố định để bảo vệ liên kết bài viết)
                      </span>
                    ) : null}
                  </div>
                  <div className="relative flex items-center">
                    <span className="pointer-events-none absolute left-3 text-xs font-mono text-slate-400 truncate max-w-[140px] sm:max-w-none">
                      /tin-tuc/
                    </span>
                    <Input
                      id="article-slug"
                      value={form.slug}
                      onChange={(event) => {
                        setAutoSlug(false);
                        set('slug', event.target.value);
                      }}
                      disabled={editing}
                      placeholder="tieu-de-bai-viet-slug"
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
                    <label htmlFor="article-excerpt" className="text-xs font-bold text-slate-700">
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
                    id="article-excerpt"
                    value={form.excerpt}
                    onChange={(event) => set('excerpt', event.target.value)}
                    placeholder="Tóm tắt ngắn gọn trong 1-2 câu để hiển thị trên danh sách bài viết, thông báo và chia sẻ mạng xã hội..."
                    className="min-h-20 text-sm leading-relaxed"
                    maxLength={1000}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Phần tóm tắt sẽ xuất hiện nổi bật đầu bài viết và làm đoạn trích khi chia sẻ Facebook, Zalo.
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
                    2. Nội dung bài viết (Markdown Studio) <span className="text-rose-500">*</span>
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
                    viewMode === 'split' ? 'md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200' : 'grid-cols-1'
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
                        placeholder={`# Tiêu đề bài viết\n\nNội dung chính của bài viết tại đây...\n\n### Điểm nhấn cập nhật\n- Tính năng mới 1\n- Tính năng mới 2\n\n> Trích dẫn thông điệp từ ban quản trị game\n\n![Ảnh minh họa](https://...)`}
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
                <span>Hỗ trợ Markdown đầy đủ: # Heading, **In đậm**, [Link](url), ![Ảnh](url), Bảng biểu.</span>
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
                        {publicArticleUrl || `https://zenxgo.io.vn/tin-tuc/${form.slug || 'slug-bai-viet'}`}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                    {form.seoTitle.trim() || form.title.trim() || 'Tiêu đề bài viết xuất hiện trên kết quả Google'}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#4d5156] line-clamp-2">
                    {form.seoDescription.trim() ||
                      form.excerpt.trim() ||
                      'Mô tả bài viết xuất hiện trên Google giúp thu hút người chơi nhấp chuột vào đọc tin tức...'}
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
                    placeholder="Mặc định lấy theo Tiêu đề bài viết nếu để trống..."
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
            {/* Card 1: Publish Status & Category */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Xuất bản & Phân loại
              </h2>

              <div className="mt-4 space-y-4">
                {/* Status Segmented Control */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    Trạng thái hiển thị
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

                {/* Linked Game */}
                <div>
                  <label htmlFor="article-game" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Game liên kết <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    id="article-game"
                    value={form.gameId}
                    onChange={(event) => set('gameId', event.target.value)}
                    disabled={editing}
                    className="h-10 text-sm font-medium disabled:bg-slate-50"
                  >
                    <option value="">Chọn tựa game phát hành</option>
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
                  ) : null}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="article-category" className="mb-1.5 block text-xs font-bold text-slate-700">
                    Chuyên mục bài viết
                  </label>
                  <Select
                    id="article-category"
                    value={form.category}
                    onChange={(event) => set('category', event.target.value as GameArticleCategory)}
                    className="h-10 text-sm font-medium"
                  >
                    {categoryOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>

                  {/* Category Description */}
                  {(() => {
                    const currentCategory = categoryOptions.find((c) => c.value === form.category);
                    if (!currentCategory) return null;
                    return (
                      <p className="mt-1.5 text-[11px] text-slate-500 italic">
                        {currentCategory.desc}
                      </p>
                    );
                  })()}
                </div>
              </div>
            </section>

            {/* Card 2: Cover Image */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                Ảnh bìa bài viết (Cover Image)
              </h2>
              <div className="mt-4">
                <ImageUploadField
                  label="Tải lên ảnh bìa 16:9"
                  value={form.coverImageUrl}
                  onChange={(val) => set('coverImageUrl', val)}
                  aspectRatio="16:9"
                  placeholder="/uploads/content/... hoặc https://..."
                  hint="Tỷ lệ khuyến nghị 16:9 (1280x720 hoặc 1920x1080). Tối đa 5MB."
                  modalTitle="Cắt & Chỉnh sửa ảnh bìa bài viết"
                />
              </div>
            </section>

            {/* Card 3: Metadata & Timestamps */}
            {editing && article ? (
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3">
                  Thông tin lưu trữ
                </h2>
                <dl className="mt-3.5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Mã bài viết (ID):</dt>
                    <dd className="flex items-center gap-1 font-mono font-bold text-slate-700">
                      <span>{article.id.slice(0, 8)}…</span>
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
                      {formatDate(article.createdAt)}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Cập nhật lần cuối:</dt>
                    <dd className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="size-3 text-slate-400" />
                      {formatDate(article.updatedAt)}
                    </dd>
                  </div>

                  {article.publishedAt ? (
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Thời điểm xuất bản:</dt>
                      <dd className="font-medium text-emerald-700">
                        {formatDate(article.publishedAt)}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {publicArticleUrl && form.status === 'PUBLISHED' ? (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <a
                      href={publicArticleUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <ExternalLink className="size-3.5" />
                      <span>Xem bài viết thực tế</span>
                    </a>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* Card 4: Quick Submit Box */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <Button
                type="submit"
                disabled={pending || !canSubmit}
                className="w-full h-11 gap-2 bg-[#00873E] font-bold text-white shadow-xs hover:bg-[#007033] disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Đang lưu dữ liệu…</span>
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    <span>{editing ? 'Lưu thay đổi bài viết' : 'Tạo & Xuất bản bài viết'}</span>
                  </>
                )}
              </Button>

              {!canSubmit && (
                <p className="mt-2 text-center text-[11px] text-amber-600">
                  * Vui lòng điền đủ Tiêu đề, Slug, Tóm tắt và Nội dung bài viết.
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function defaultForm(): ArticleForm {
  return {
    gameId: '',
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImageUrl: '',
    category: 'DEVELOPMENT_UPDATE',
    seoTitle: '',
    seoDescription: '',
    status: 'DRAFT',
  };
}

function toForm(article: AdminContentArticle): ArticleForm {
  return {
    gameId: article.gameId,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content ?? '',
    coverImageUrl: article.coverImageUrl ?? '',
    category: article.category as GameArticleCategory,
    seoTitle: article.seoTitle ?? '',
    seoDescription: article.seoDescription ?? '',
    status: article.status,
  };
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
      href="/admin/content/articles"
      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
    >
      <ArrowLeft className="size-4" /> Quay lại danh sách bài viết
    </Link>
  );
}
