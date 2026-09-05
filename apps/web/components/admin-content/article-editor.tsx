'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  FileText,
  Globe,
  Save,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AdminContentArticle,
  ContentPublishStatus,
  GameArticleCategory,
} from '@zenx-go/api-client';
import { useAdminContentArticle, useAdminContentGames } from '@/hooks/use-content';
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

const categoryOptions: Array<{ value: GameArticleCategory; label: string; desc: string }> = [
  {
    value: 'DEVELOPMENT_UPDATE',
    label: 'Cập nhật phát triển',
    desc: 'Bản vá (patch notes), tính năng mới, lộ trình',
  },
  {
    value: 'ANNOUNCEMENT',
    label: 'Thông báo',
    desc: 'Thông báo chung từ ban quản trị, tin cộng đồng',
  },
  {
    value: 'EVENT',
    label: 'Sự kiện',
    desc: 'Sự kiện in-game, đua top, minigame nhận quà',
  },
  {
    value: 'MAINTENANCE',
    label: 'Bảo trì hệ thống',
    desc: 'Lịch bảo trì máy chủ, downtime, nâng cấp hạ tầng',
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

  useEffect(() => {
    if (article && !initialized) {
      setForm(toForm(article));
      setInitialized(true);
      setAutoSlug(false);
    }
  }, [article, initialized]);

  // Auto generate slug from title if creating new
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

  if (editing && articleQuery.isLoading) {
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

  if (editing && (articleQuery.isError || !article)) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>{getErrorMessage(articleQuery.error, 'Không thể tải dữ liệu bài viết.')}</Alert>
      </div>
    );
  }

  const set = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const canSubmit =
    Boolean(form.gameId) &&
    form.title.trim().length >= 3 &&
    form.slug.trim().length >= 3 &&
    form.excerpt.trim().length >= 3 &&
    form.content.trim().length > 0;

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/70 bg-gradient-to-r from-emerald-500/10 via-emerald-50/50 to-white p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00873E]/10 px-3 py-1 text-xs font-bold text-[#00873E]">
                <FileText className="size-3.5" /> {editing ? 'Biên tập bài viết' : 'Soạn bài viết mới'}
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
              {editing ? form.title || 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {editing
                ? 'Cập nhật tiêu đề, ảnh đại diện, nội dung Markdown và thông số SEO.'
                : 'Điền thông tin và soạn thảo nội dung bằng trình hỗ trợ Markdown trực quan.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/content/articles')}
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
              {pending ? 'Đang lưu…' : editing ? 'Lưu bài viết' : 'Xuất bản / Tạo mới'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form */}
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
          {/* Left 2 Cols: Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* General Info */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-base font-black text-slate-900">Thông tin cơ bản</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Tiêu đề hiển thị và đường dẫn định danh bài viết.
              </p>

              <div className="mt-5 space-y-4">
                <Field label="Tiêu đề bài viết (*)">
                  <Input
                    value={form.title}
                    onChange={(event) => handleTitleChange(event.target.value)}
                    placeholder="Ví dụ: Bản cập nhật 1.2: Vùng đất mới và sự kiện Giáng Sinh"
                    maxLength={240}
                    className="h-11 font-semibold text-slate-900"
                  />
                </Field>

                <Field
                  label="URL Slug (*)"
                  hint={
                    editing
                      ? 'Slug được tạo cố định khi bài viết khởi tạo để không làm gãy liên kết.'
                      : 'Định danh thân thiện trên đường dẫn trình duyệt.'
                  }
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                      /articles/
                    </span>
                    <Input
                      value={form.slug}
                      onChange={(event) => {
                        setAutoSlug(false);
                        set('slug', event.target.value);
                      }}
                      disabled={editing}
                      placeholder="ban-cap-nhat-1-2"
                      maxLength={180}
                      className="h-10 pl-20 font-mono text-xs disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </Field>

                <Field
                  label="Tóm tắt ngắn (Excerpt) (*)"
                  hint="Hiển thị trên thẻ bài viết danh sách và snippet chia sẻ mạng xã hội."
                >
                  <Textarea
                    value={form.excerpt}
                    onChange={(event) => set('excerpt', event.target.value)}
                    placeholder="Mô tả tóm lược nội dung quan trọng nhất của bài viết..."
                    className="min-h-24 text-sm"
                    maxLength={1000}
                  />
                </Field>
              </div>
            </section>

            {/* Markdown Content & Split Preview */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-[#00873E]" />
                    <h2 className="text-base font-black text-slate-900">Nội dung Markdown (*)</h2>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Hỗ trợ tiêu đề #, danh sách -, in đậm **, bảng biểu và trích dẫn.
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
                    onChange={(event) => set('content', event.target.value)}
                    className="min-h-[480px] font-mono text-sm leading-relaxed"
                    placeholder={`# Tiêu đề bài viết\n\nNội dung chính...\n\n### Điểm nhấn cập nhật\n- Tính năng mới\n- Sửa lỗi`}
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
                        Chưa có nội dung xem trước. Hãy nhập nội dung Markdown ở khung bên trái.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                Ghi chú an toàn: Raw HTML và các liên kết ngoài dạng không an toàn sẽ tự động được lọc.
              </p>
            </section>

            {/* SEO Section */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-[#00873E]" />
                <h2 className="text-base font-black text-slate-900">Tối ưu hóa SEO (Tùy chọn)</h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Cung cấp tiêu đề và mô tả riêng cho công cụ tìm kiếm Google.
              </p>

              <div className="mt-5 space-y-4">
                <Field label="SEO Title">
                  <Input
                    value={form.seoTitle}
                    onChange={(event) => set('seoTitle', event.target.value)}
                    placeholder="Mặc định lấy theo tiêu đề bài viết nếu để trống"
                    maxLength={240}
                  />
                </Field>

                <Field label="SEO Description">
                  <Textarea
                    value={form.seoDescription}
                    onChange={(event) => set('seoDescription', event.target.value)}
                    placeholder="Mặc định lấy theo phần tóm tắt Excerpt nếu để trống..."
                    className="min-h-20 text-xs"
                    maxLength={500}
                  />
                </Field>
              </div>
            </section>
          </div>

          {/* Right Col: Metadata, Settings & Cover Upload */}
          <div className="space-y-6">
            {/* Publish & Status Card */}
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <h3 className="font-black text-slate-900">Xuất bản & Phân loại</h3>

              <div className="mt-5 space-y-4">
                <Field label="Trạng thái bài viết">
                  <Select
                    value={form.status}
                    onChange={(event) => set('status', event.target.value as ContentPublishStatus)}
                    className="h-10 text-sm font-semibold"
                  >
                    <option value="DRAFT">📝 Bản nháp (Chưa công khai)</option>
                    <option value="PUBLISHED">🚀 Đã xuất bản (Công khai)</option>
                  </Select>
                </Field>

                <Field label="Game liên kết (*)">
                  <Select
                    value={form.gameId}
                    onChange={(event) => set('gameId', event.target.value)}
                    disabled={editing}
                    className="h-10 text-sm"
                  >
                    <option value="">Chọn tựa game</option>
                    {(games.data?.items ?? []).map((game) => (
                      <option key={game.id} value={game.id}>
                        {game.name} ({game.code})
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Chuyên mục bài viết">
                  <Select
                    value={form.category}
                    onChange={(event) => set('category', event.target.value as GameArticleCategory)}
                    className="h-10 text-sm"
                  >
                    {categoryOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                {/* Cover Image with Upload & Crop Tool */}
                <div className="border-t border-slate-100 pt-4">
                  <ImageUploadField
                    label="Ảnh bìa (Cover Image)"
                    value={form.coverImageUrl}
                    onChange={(val) => set('coverImageUrl', val)}
                    aspectRatio="16:9"
                    placeholder="/uploads/content/... hoặc https://..."
                    hint="Tải ảnh lên máy chủ hoặc cắt theo tỷ lệ chuẩn 16:9."
                    modalTitle="Cắt & Chỉnh sửa ảnh bìa bài viết"
                  />
                </div>
              </div>
            </section>

            {/* Quick Action Footer */}
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={pending || !canSubmit}
                  className="w-full h-11 gap-2 bg-[#00873E] font-bold text-white hover:bg-[#007033]"
                >
                  <Save className="size-4" />
                  {pending ? 'Đang lưu dữ liệu…' : editing ? 'Lưu thay đổi' : 'Tạo bài viết ngay'}
                </Button>

                {!canSubmit && (
                  <p className="text-center text-[11px] text-amber-600">
                    * Vui lòng chọn Game và điền đầy đủ Tiêu đề, Slug, Excerpt và Nội dung.
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
