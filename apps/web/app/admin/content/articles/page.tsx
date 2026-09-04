'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, FileText, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ContentPublishStatus, GameArticleCategory } from '@zenx-go/api-client';
import { useAdminContentArticles, useAdminContentGames } from '@/hooks/use-content';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const categories: Array<{ value: '' | GameArticleCategory; label: string }> = [
  { value: '', label: 'Tất cả chuyên mục' },
  { value: 'DEVELOPMENT_UPDATE', label: 'Cập nhật phát triển' },
  { value: 'ANNOUNCEMENT', label: 'Thông báo' },
  { value: 'EVENT', label: 'Sự kiện' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
];

export default function AdminContentArticlesPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [gameId, setGameId] = useState('');
  const [category, setCategory] = useState<'' | GameArticleCategory>('');
  const [status, setStatus] = useState<'' | ContentPublishStatus>('');
  const [page, setPage] = useState(1);
  const games = useAdminContentGames({ page: 1, pageSize: 50 });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = useMemo(() => ({ page, pageSize: 20, search: debounced || undefined, gameId: gameId || undefined, category: category || undefined, status: status || undefined }), [category, debounced, gameId, page, status]);
  const articles = useAdminContentArticles(query);
  const totalPages = Math.max(1, articles.data?.totalPages ?? 1);
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-[#00873E]">Content CMS</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Bài viết</h2><p className="mt-1 text-sm text-slate-500">Soạn Markdown, lưu nháp hoặc publish ngay.</p></div>
        <Button asChild size="sm"><Link href="/admin/content/articles/new"><Plus className="size-4" /> Tạo bài viết</Link></Button>
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_200px_170px]">
          <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm title, slug hoặc excerpt…" className="pl-10" aria-label="Tìm bài viết" /></div>
          <Select value={gameId} onChange={(event) => { setGameId(event.target.value); setPage(1); }} aria-label="Lọc game"><option value="">Tất cả game</option>{(games.data?.items ?? []).map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</Select>
          <Select value={category} onChange={(event) => { setCategory(event.target.value as '' | GameArticleCategory); setPage(1); }} aria-label="Lọc chuyên mục">{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>
          <Select value={status} onChange={(event) => { setStatus(event.target.value as '' | ContentPublishStatus); setPage(1); }} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã publish</option></Select>
        </div>
      </section>
      {articles.isLoading ? <ArticleSkeleton /> : articles.isError || !articles.data ? <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">Không thể tải danh sách bài viết.</div> : <>
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {articles.data.items.length ? <div className="divide-y divide-slate-100">{articles.data.items.map((article) => <Link key={article.id} href={`/admin/content/articles/${article.id}`} className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]"><FileText className="size-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-[#00873E]">{article.game?.name ?? 'Portal'}</span><StatusBadge status={article.status} /></div><p className="mt-1 truncate text-sm font-bold text-slate-800">{article.title}</p><p className="mt-1 truncate text-xs text-slate-500">{article.slug} · {categoryLabel(article.category)}</p></div></div><div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end"><span className="text-[11px] text-slate-400">{article.publishedAt ? `Publish ${formatDate(article.publishedAt)}` : `Cập nhật ${formatDate(article.updatedAt)}`}</span></div></Link>)}</div> : <div className="p-12 text-center text-sm text-slate-500">Không có bài viết phù hợp.</div>}
        </section>
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row"><span>{articles.data.total.toLocaleString('vi-VN')} bài viết</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || articles.isFetching}><ChevronLeft className="size-4" /> Trước</Button><span className="min-w-24 text-center font-semibold text-slate-700">Trang {articles.data.page} / {totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages || articles.isFetching}>Sau <ChevronRight className="size-4" /></Button></div></div>
      </>}
    </div>
  );
}

function categoryLabel(value: string) { return categories.find((item) => item.value === value)?.label ?? value; }
function StatusBadge({ status }: { status: ContentPublishStatus }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{status === 'PUBLISHED' ? 'Đã publish' : 'Bản nháp'}</span>; }
function ArticleSkeleton() { return <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">{[1, 2, 3, 4, 5].map((value) => <Skeleton key={value} className="h-16 rounded-xl" />)}</div>; }
