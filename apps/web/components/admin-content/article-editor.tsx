'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, Save } from 'lucide-react';
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
import { toast } from 'sonner';

const categoryOptions: Array<{ value: GameArticleCategory; label: string }> = [
  { value: 'DEVELOPMENT_UPDATE', label: 'Cập nhật phát triển' },
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
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

  useEffect(() => {
    if (article && !initialized) {
      setForm(toForm(article));
      setInitialized(true);
    }
  }, [article, initialized]);

  const create = useMutation({
    mutationFn: () => api.admin.content.createArticle({ ...form, coverImageUrl: form.coverImageUrl || null }),
    onSuccess: () => {
      toast.success('Đã tạo bài viết.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'articles'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
      router.push('/admin/content/articles');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const update = useMutation({
    mutationFn: () => api.admin.content.updateArticle(articleId!, {
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
      toast.success('Đã lưu bài viết.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'article', articleId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'articles'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const pending = create.isPending || update.isPending;
  if (editing && articleQuery.isLoading) return <Skeleton className="h-[900px] rounded-2xl" />;
  if (editing && (articleQuery.isError || !article)) {
    return <div className="space-y-4"><BackLink /><Alert>{getErrorMessage(articleQuery.error, 'Không thể tải bài viết.')}</Alert></div>;
  }
  const set = <K extends keyof ArticleForm>(key: K, value: ArticleForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const canSubmit = Boolean(form.gameId) && form.title.trim().length >= 3 && form.slug.trim().length >= 3 && form.excerpt.trim().length >= 3 && form.content.trim().length > 0;
  return (
    <div className="space-y-6">
      <BackLink />
      <div><p className="text-sm font-semibold text-[#00873E]">Content CMS / Bài viết</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{editing ? 'Sửa bài viết' : 'Tạo bài viết'}</h2><p className="mt-1 text-sm text-slate-500">Slug chỉ nhập một lần để không làm hỏng liên kết public.</p></div>
      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); if (!canSubmit) return; if (editing) update.mutate(); else create.mutate(); }}>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Game"><Select value={form.gameId} onChange={(event) => set('gameId', event.target.value)} disabled={editing}><option value="">Chọn game</option>{(games.data?.items ?? []).map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</Select></Field>
            <Field label="Chuyên mục"><Select value={form.category} onChange={(event) => set('category', event.target.value as GameArticleCategory)}>{categoryOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field>
            <Field label="Tiêu đề"><Input value={form.title} onChange={(event) => set('title', event.target.value)} maxLength={240} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={(event) => set('slug', event.target.value)} disabled={editing} placeholder="ban-cap-nhat-moi" maxLength={180} /></Field>
            <Field label="Trạng thái"><Select value={form.status} onChange={(event) => set('status', event.target.value as ContentPublishStatus)}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Publish ngay</option></Select></Field>
            <Field label="Cover URL"><Input value={form.coverImageUrl} onChange={(event) => set('coverImageUrl', event.target.value)} placeholder="/images/... hoặc https://..." /></Field>
            <div className="md:col-span-2"><Field label="Excerpt"><Textarea value={form.excerpt} onChange={(event) => set('excerpt', event.target.value)} className="min-h-24" maxLength={1000} /></Field></div>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2"><Eye className="size-4 text-[#00873E]" /><h3 className="font-black text-slate-900">Nội dung Markdown</h3></div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Textarea aria-label="Nội dung Markdown" value={form.content} onChange={(event) => set('content', event.target.value)} className="min-h-[420px] font-mono text-sm" placeholder="# Tiêu đề\n\nNội dung bài viết…" maxLength={50000} />
            <div className="min-h-[420px] rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Preview</p><SupportMarkdown>{form.content || 'Chưa có nội dung.'}</SupportMarkdown></div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">Raw HTML, hình ảnh và link ngoài http/https không được phép.</p>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="font-black text-slate-900">SEO (tuỳ chọn)</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="SEO title"><Input value={form.seoTitle} onChange={(event) => set('seoTitle', event.target.value)} maxLength={240} /></Field><Field label="SEO description"><Textarea value={form.seoDescription} onChange={(event) => set('seoDescription', event.target.value)} className="min-h-24" maxLength={500} /></Field></div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"><div className="flex justify-end"><Button type="submit" disabled={pending || !canSubmit}><Save className="size-4" /> {pending ? 'Đang lưu…' : editing ? 'Lưu bài viết' : 'Tạo bài viết'}</Button></div></section>
      </form>
    </div>
  );
}

function defaultForm(): ArticleForm {
  return { gameId: '', title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', category: 'DEVELOPMENT_UPDATE', seoTitle: '', seoDescription: '', status: 'DRAFT' };
}

function toForm(article: AdminContentArticle): ArticleForm {
  return { gameId: article.gameId, title: article.title, slug: article.slug, excerpt: article.excerpt, content: article.content ?? '', coverImageUrl: article.coverImageUrl ?? '', category: article.category as GameArticleCategory, seoTitle: article.seoTitle ?? '', seoDescription: article.seoDescription ?? '', status: article.status };
}

function BackLink() { return <Link href="/admin/content/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại bài viết</Link>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-xs font-bold text-slate-700">{label}</span>{children}</label>; }
