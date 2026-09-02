import { TopAnnouncementRibbon } from '@/components/home/top-announcement-ribbon';
import { HomeNavbar } from '@/components/home/home-navbar';
import { HeroShowcase } from '@/components/home/hero-showcase';
import { QuickUtilityStrip } from '@/components/home/quick-utility-strip';
import { GamesSection } from '@/components/home/games-section';
import { NewsSection } from '@/components/home/news-section';
import { EcosystemSection } from '@/components/home/ecosystem-section';
import { CtaBannerSection } from '@/components/home/cta-banner-section';
import { HomeFooter } from '@/components/home/home-footer';
import { getPortalHome } from '@/lib/game-api';
import { gameItemFromSummary, newsItemFromArticle } from '@/lib/games-data';
import { portalUrl } from '@/lib/domain';

export const metadata = {
  title: 'ZENX GO - Cổng Game & Nền Tảng Tài Khoản Hệ Sinh Thái',
  description: 'Khám phá thế giới game đỉnh cao với Lục Địa Đam Mê, Vương Triều Hỏa Long, Thị Trấn Mây và Chiến Tuyến Orion. Một tài khoản, nhiều thế giới cùng ví ZENX Coin.',
  alternates: { canonical: portalUrl('/') },
  openGraph: { title: 'ZENX GO Game Hub', description: 'Một tài khoản, nhiều thế giới game cùng ZENX GO.', url: portalUrl('/') },
};

export const revalidate = 60;
// Public content must not be prerendered while the API is unavailable during a build.
// The server data loader still enforces its own timeout and section-level error state.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const result = await getPortalHome();
  const home = result.data;
  const games = home?.games.map(gameItemFromSummary) ?? [];
  const heroGames = ((home?.heroGames && home.heroGames.length > 1) ? home.heroGames : (home?.games ?? [])).map(gameItemFromSummary);
  const news = home?.latestArticles ?? [];
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-[#00873E]/20 selection:text-slate-900 scroll-smooth">
      {/* Top Event Announcement Ribbon */}
      <TopAnnouncementRibbon announcement={home?.announcement ?? null} />

      {/* Top Header Navigation */}
      <HomeNavbar />

      <main className="flex-1 flex flex-col space-y-4 sm:space-y-6">
        {/* Section 1: Hero Showcase Carousel */}
        <HeroShowcase games={heroGames} dataUnavailable={result.error} />

        {/* Section 2: Quick Utility Ticker Strip */}
        <QuickUtilityStrip />

        {/* Section 3: Games Catalog Grid ("Tìm game dành cho bạn") */}
        <GamesSection games={games} dataUnavailable={result.error} />

        {/* Section 4: News & Updates ("Tin mới từ các thế giới") */}
        <NewsSection news={news.map(newsItemFromArticle)} dataUnavailable={result.error} />

        {/* Section 5: Ecosystem & User Hub ("Một tài khoản. Nhiều thế giới") */}
        <EcosystemSection games={games} />

        {/* Section 6: Pre-Footer CTA Epic Banner */}
        <CtaBannerSection />
      </main>

      {/* Comprehensive Footer */}
      <HomeFooter games={games} />
    </div>
  );
}
