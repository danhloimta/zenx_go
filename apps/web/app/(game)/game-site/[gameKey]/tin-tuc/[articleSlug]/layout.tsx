import type { Metadata } from 'next';
import { gameUrl } from '@/lib/domain';
import { getGameBySubdomain } from '@/lib/game-api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ gameKey: string; articleSlug: string }> }): Promise<Metadata> {
  const { gameKey, articleSlug } = await params;
  const game = await getGameBySubdomain(gameKey);
  const article = game?.articles.find((item) => item.slug === articleSlug);
  if (!game || !article) return { title: 'Bài viết không khả dụng | ZENX GO', robots: { index: false, follow: false } };
  const canonical = gameUrl(game.subdomain, `/tin-tuc/${article.slug}`);
  return {
    metadataBase: new URL(canonical),
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt,
    alternates: { canonical },
    openGraph: { title: article.seoTitle ?? article.title, description: article.seoDescription ?? article.excerpt, url: canonical, images: article.coverImageUrl ? [article.coverImageUrl] : undefined },
  };
}

export default function GameArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
