import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { gameUrl } from '@/lib/domain';
import { getGameArticle, getGameBySubdomain } from '@/lib/game-api';

export default async function ArticlePage({ params }: { params: Promise<{ gameKey: string; articleSlug: string }> }) {
  const { gameKey, articleSlug } = await params;
  const game = await getGameBySubdomain(gameKey);
  if (!game) notFound();
  const article = await getGameArticle(game.slug, decodeURIComponent(articleSlug));
  if (!article) notFound();

  return <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><Link href={gameUrl(game.subdomain, '/tin-tuc')} className="inline-flex items-center gap-2 text-sm font-semibold opacity-65 hover:opacity-100"><ArrowLeft className="size-4" /> Tất cả tin tức</Link><div className="mx-auto max-w-3xl"><p className="mt-10 text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">{article.category.replaceAll('_', ' ')}</p><h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{article.title}</h1><p className="mt-4 inline-flex items-center gap-2 text-sm opacity-60"><CalendarDays className="size-4" /> {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>{article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.title} className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" /> : null}<div className="prose prose-slate mt-10 max-w-none leading-8" dangerouslySetInnerHTML={{ __html: withoutLeadingTitle(article.contentHtml) }} /></div>{article.related.length ? <section className="mt-16 border-t border-black/10 pt-10"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">Đọc tiếp</p><h2 className="mt-3 text-2xl font-black">Bài viết liên quan</h2><div className="mt-6 grid gap-5 md:grid-cols-3">{article.related.map((related) => <Link key={related.slug} href={gameUrl(game.subdomain, `/tin-tuc/${related.slug}`)} className="group rounded-2xl border border-black/10 bg-white/55 p-5 transition-all hover:-translate-y-1 hover:border-[var(--game-primary)] hover:shadow-lg"><p className="text-xs font-bold uppercase tracking-wider text-[var(--game-primary)]">{related.category.replaceAll('_', ' ')}</p><h3 className="mt-3 font-bold">{related.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 opacity-70">{related.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[var(--game-primary)]">Đọc bài viết <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></Link>)}</div></section> : null}</article>;
}

function withoutLeadingTitle(contentHtml: string) {
  return contentHtml.replace(/^\s*<h1>[^<]*<\/h1>/i, '');
}
