import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Radio, Flame } from 'lucide-react';
import { gameUrl } from '@/lib/domain';
import { getGameArticle, getGameBySubdomain } from '@/lib/game-api';
import { formatCategoryLabel } from '@/lib/games-data';

export default async function ArticlePage({ params }: { params: Promise<{ gameKey: string; articleSlug: string }> }) {
  const { gameKey, articleSlug } = await params;
  const game = await getGameBySubdomain(gameKey);
  if (!game) notFound();
  const article = await getGameArticle(game.slug, decodeURIComponent(articleSlug));
  if (!article) notFound();

  const isOrion = game.slug === 'chien-tuyen-orion' || game.subdomain === 'orion';
  const isHoaLong = game.slug === 'vuong-trieu-hoa-long' || game.subdomain === 'hoalong';
  const isLucDiaDamMe = game.slug === 'luc-dia-dam-me' || game.subdomain === 'lucdia';

  return (
    <article className="mx-auto max-w-4xl px-4 py-12 sm:py-16 sm:px-6">
      {/* Back Link */}
      <Link
        href={gameUrl(game.subdomain, '/tin-tuc')}
        className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold transition-colors ${
          isOrion
            ? 'text-cyan-400 hover:text-cyan-300 font-mono'
            : isHoaLong
            ? 'text-amber-400 hover:text-amber-300 font-serif'
            : isLucDiaDamMe
            ? 'text-[#9d7d47] hover:text-[#7d6032] font-serif'
            : 'text-[#118a94] hover:text-[#0d6e76]'
        }`}
      >
        <ArrowLeft className="size-4" />
        <span>Tất cả bài viết</span>
      </Link>

      <div className="mx-auto max-w-3xl mt-8">
        {/* Category Badge */}
        <div>
          {isOrion ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Radio className="size-3.5 animate-pulse text-cyan-400" />
              {formatCategoryLabel(article.category)}
            </span>
          ) : isHoaLong ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-serif font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-500/40 text-amber-300">
              <Flame className="size-3.5 text-amber-400" />
              {formatCategoryLabel(article.category)}
            </span>
          ) : (
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isLucDiaDamMe ? 'text-[#9d7d47] font-serif' : 'text-[#118a94]'
            }`}>
              {formatCategoryLabel(article.category)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className={`mt-4 text-3xl sm:text-5xl font-black leading-tight tracking-tight ${
          isOrion
            ? 'text-white font-mono'
            : isHoaLong
            ? 'text-white font-serif'
            : isLucDiaDamMe
            ? 'text-[#152238] font-serif'
            : 'text-slate-900 font-serif'
        }`}>
          {article.title}
        </h1>

        {/* Date Meta */}
        <p className={`mt-4 inline-flex items-center gap-2 text-xs sm:text-sm ${
          isOrion
            ? 'text-slate-400 font-mono'
            : isHoaLong
            ? 'text-[#8a7a63]'
            : 'text-slate-500'
        }`}>
          <CalendarDays className="size-4" />
          <span>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Chưa cập nhật'}</span>
        </p>

        {/* Cover Image */}
        {article.coverImageUrl ? (
          <div className={`mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl border shadow-xl ${
            isOrion
              ? 'border-cyan-500/30 bg-slate-950'
              : isHoaLong
              ? 'border-[#251b14] bg-black'
              : 'border-slate-200 bg-slate-100'
          }`}>
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="size-full object-cover"
            />
          </div>
        ) : null}

        {/* Article HTML Content */}
        <div
          className={`mt-10 max-w-none leading-8 ${
            isOrion
              ? 'prose prose-invert prose-cyan text-slate-300 prose-headings:text-white prose-headings:font-mono prose-a:text-cyan-400 prose-strong:text-cyan-200'
              : isHoaLong
              ? 'prose prose-invert prose-amber text-[#ead8b5] prose-headings:text-white prose-headings:font-serif prose-a:text-amber-400 prose-strong:text-amber-200'
              : isLucDiaDamMe
              ? 'prose prose-slate max-w-none text-[#2b3d56] prose-headings:text-[#152238] prose-headings:font-serif prose-a:text-[#9d7d47]'
              : 'prose prose-slate max-w-none text-slate-700 prose-headings:text-[#123b63] prose-headings:font-serif prose-a:text-[#118a94]'
          }`}
          dangerouslySetInnerHTML={{ __html: withoutLeadingTitle(article.contentHtml) }}
        />
      </div>

      {/* Related Articles */}
      {article.related.length ? (
        <section className={`mt-16 pt-10 border-t ${
          isOrion
            ? 'border-slate-800'
            : isHoaLong
            ? 'border-[#251b14]'
            : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isOrion
                ? 'text-cyan-400 font-mono'
                : isHoaLong
                ? 'text-amber-400 font-serif'
                : isLucDiaDamMe
                ? 'text-[#9d7d47] font-serif'
                : 'text-[#118a94]'
            }`}>
              Tiếp tục theo dõi
            </span>
          </div>

          <h2 className={`text-2xl font-black ${
            isOrion
              ? 'text-white font-mono'
              : isHoaLong
              ? 'text-white font-serif'
              : isLucDiaDamMe
              ? 'text-[#152238] font-serif'
              : 'text-slate-900 font-serif'
          }`}>
            Bài viết liên quan
          </h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {article.related.map((related) => (
              <Link
                key={related.slug}
                href={gameUrl(game.subdomain, `/tin-tuc/${related.slug}`)}
                className={`group rounded-2xl border p-5 sm:p-6 transition-all hover:-translate-y-1 flex flex-col justify-between ${
                  isOrion
                    ? 'border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 hover:bg-slate-900 text-white shadow-md'
                    : isHoaLong
                    ? 'border-[#251b14] bg-[#121110] hover:border-amber-500/40 text-[#ead8b5] shadow-md'
                    : isLucDiaDamMe
                    ? 'border-black/5 bg-white hover:border-[#c8c7be] text-[#152238] shadow-xs hover:shadow-md'
                    : 'border-slate-200 bg-white hover:border-[#118a94]/40 text-slate-800 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isOrion
                      ? 'text-cyan-400 font-mono'
                      : isHoaLong
                      ? 'text-amber-400 font-serif'
                      : isLucDiaDamMe
                      ? 'text-[#9d7d47] font-serif'
                      : 'text-[#118a94]'
                  }`}>
                    {formatCategoryLabel(related.category)}
                  </span>

                  <h3 className={`mt-2 font-bold text-base transition-colors ${
                    isOrion
                      ? 'text-white group-hover:text-cyan-300'
                      : isHoaLong
                      ? 'text-[#ead8b5] group-hover:text-amber-300 font-serif'
                      : isLucDiaDamMe
                      ? 'text-[#152238] group-hover:text-[#9d7d47] font-serif'
                      : 'text-slate-900 group-hover:text-[#118a94]'
                  }`}>
                    {related.title}
                  </h3>

                  <p className={`mt-2 line-clamp-2 text-xs leading-relaxed ${
                    isOrion
                      ? 'text-slate-400'
                      : isHoaLong
                      ? 'text-[#baa98a]'
                      : 'text-slate-600'
                  }`}>
                    {related.excerpt}
                  </p>
                </div>

                <span className={`mt-5 inline-flex items-center gap-1.5 text-xs font-bold transition-transform duration-200 group-hover:translate-x-1 ${
                  isOrion
                    ? 'text-cyan-400 font-mono'
                    : isHoaLong
                    ? 'text-amber-400 font-serif'
                    : isLucDiaDamMe
                    ? 'text-[#9d7d47] font-serif'
                    : 'text-[#118a94]'
                }`}>
                  <span>Đọc bài viết</span>
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function withoutLeadingTitle(contentHtml: string) {
  return contentHtml.replace(/^\s*<h1>[^<]*<\/h1>/i, '');
}
