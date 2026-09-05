'use client';

import Link from 'next/link';
import { ArrowRight, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { GamePageItem, GameTemplatePreset } from '@zenx-go/api-client';
import { useGame } from './game-context';
import { gameUrl, portalUrl } from '@/lib/domain';
import { formatCategoryLabel, formatMilestoneStatus } from '@/lib/games-data';
import { ThiTranMayHome } from './thi-tran-may-home';
import { LucDiaDamMeHome } from './luc-dia-dam-me-home';
import { VuongTrieuHoaLongHome } from './vuong-trieu-hoa-long-home';
import { ChienTuyenOrionHome } from './chien-tuyen-orion-home';

const presetLabels: Record<GameTemplatePreset, { featureTitle: string; galleryTitle: string }> = {
  EDITORIAL_FANTASY: { featureTitle: 'Những điều làm nên hành trình', galleryTitle: 'Góc nhìn từ thế giới game' },
  DARK_STRATEGY: { featureTitle: 'Mỗi quyết định tạo nên cục diện', galleryTitle: 'Chiến trường qua từng mùa' },
  PLAYFUL_CASUAL: { featureTitle: 'Những điều nhỏ làm nên niềm vui', galleryTitle: 'Khoảnh khắc đáng nhớ' },
  SCI_FI_SHOOTER: { featureTitle: 'Tổ đội được xây dựng để phối hợp', galleryTitle: 'Dữ liệu từ chiến tuyến' },
};

export function GameTemplateHome() {
  const game = useGame();
  const config = game.pageConfig;
  if (config.legacyRenderer === 'PLAYFUL_CASUAL') return <ThiTranMayHome />;
  if (config.legacyRenderer === 'EDITORIAL_FANTASY') return <LucDiaDamMeHome />;
  if (config.legacyRenderer === 'DARK_STRATEGY') return <VuongTrieuHoaLongHome />;
  if (config.legacyRenderer === 'SCI_FI_SHOOTER') return <ChienTuyenOrionHome />;
  const labels = presetLabels[game.themePreset] ?? presetLabels.EDITORIAL_FANTASY;
  const sections = game.featureConfig.sections;
  const primaryPath = game.primaryCtaPath ?? '/tin-tuc';

  return <div className={`game-template-home game-template-${game.themePreset.toLowerCase()}`}>
    {sections.includes('HERO') ? <section className="relative isolate overflow-hidden bg-slate-950 text-white"><picture><source media="(max-width: 767px)" srcSet={config.hero.mobileImageUrl ?? config.hero.imageUrl ?? game.heroMobileUrl ?? game.heroDesktopUrl ?? game.coverUrl ?? undefined} /><img src={config.hero.imageUrl ?? game.heroDesktopUrl ?? game.coverUrl ?? undefined} alt="" className="absolute inset-0 -z-20 size-full object-cover opacity-70" /></picture><div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/65 to-black/20" /><div className="mx-auto flex min-h-[560px] max-w-7xl items-end px-4 pb-16 pt-28 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-secondary)]">{config.hero.eyebrow || 'ZENX GO'}</p><h1 className="text-4xl font-black tracking-tight sm:text-6xl">{config.hero.title || game.name}</h1><p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">{config.hero.description || game.tagline}</p><div className="mt-8 flex flex-wrap gap-3"><Link href={gameUrl(game.subdomain, primaryPath)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--game-primary)] px-6 text-sm font-bold text-white">{game.primaryCtaLabel ?? 'Khám phá game'} <ArrowRight className="size-4" /></Link>{game.secondaryCtaPath ? <Link href={gameUrl(game.subdomain, game.secondaryCtaPath)} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 px-6 text-sm font-bold text-white hover:bg-white/10">{game.secondaryCtaLabel ?? 'Xem thêm'}</Link> : null}</div></div></div></section> : null}

    <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6 lg:px-8">
      {sections.includes('GAME_INTRODUCTION') ? <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">{config.intro.eyebrow || 'Về game'}</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">{config.intro.title || `Khám phá ${game.name}`}</h2><p className="mt-5 max-w-2xl text-base leading-8 opacity-75">{config.intro.description || game.longDescription || game.shortDescription}</p></div>{config.intro.imageUrl ? <img src={config.intro.imageUrl} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-sm" /> : <div className="rounded-3xl border border-black/10 bg-white/55 p-6"><p className="text-sm leading-7 opacity-75">{game.shortDescription}</p><div className="mt-6 flex flex-wrap gap-2">{game.platforms.map((platform) => <span key={platform} className="rounded-full border border-black/10 px-3 py-1.5 text-sm font-semibold">{platform}</span>)}</div></div>}</section> : null}
      {sections.includes('FEATURE_GRID') && config.featureCards.length ? <CardGrid title={labels.featureTitle} items={config.featureCards} /> : null}
      {game.themePreset === 'SCI_FI_SHOOTER' && config.roles.length ? <CardGrid title="Các vai trò trong đội hình" items={config.roles} /> : null}
      {game.themePreset === 'SCI_FI_SHOOTER' && config.locations.length ? <CardGrid title="Khu vực tác chiến" items={config.locations} /> : null}
      {game.themePreset === 'SCI_FI_SHOOTER' && config.equipment.length ? <CardGrid title="Trang bị chiến thuật" items={config.equipment} /> : null}
      {config.gallery.length ? <Gallery title={labels.galleryTitle} items={config.gallery} /> : null}
      {config.faqs.length ? <section><SectionHeading title="Câu hỏi thường gặp" /><div className="mt-8 grid gap-3 md:grid-cols-2">{config.faqs.map((faq) => <details key={faq.question} className="rounded-2xl border border-black/10 bg-white/55 p-5"><summary className="cursor-pointer font-bold">{faq.question}</summary><p className="mt-3 text-sm leading-7 opacity-70">{faq.answer}</p></details>)}</div></section> : null}
      {sections.includes('ROADMAP_PREVIEW') && game.milestones.length ? <section><SectionHeading title="Lộ trình vận hành" /><div className="mt-8 grid gap-3 md:grid-cols-3">{game.milestones.slice(0, 3).map((milestone) => <div key={milestone.title} className="rounded-2xl border border-black/10 bg-white/55 p-5"><div className="flex items-center justify-between gap-3 text-xs font-bold opacity-60"><span>{milestone.displayPeriod}</span><span>{formatMilestoneStatus(milestone.status)}</span></div><h3 className="mt-4 font-bold">{milestone.title}</h3><p className="mt-2 text-sm leading-6 opacity-70">{milestone.description}</p></div>)}</div></section> : null}
      {sections.includes('ARTICLE_GRID') && game.articles.length ? <section><SectionHeading title="Tin tức mới nhất" /><div className="mt-8 grid gap-5 md:grid-cols-3">{game.articles.slice(0, 3).map((article) => <Link key={article.slug} href={gameUrl(game.subdomain, `/tin-tuc/${article.slug}`)} className="overflow-hidden rounded-2xl border border-black/10 bg-white/55 hover:border-[var(--game-primary)]">{article.coverImageUrl ? <img src={article.coverImageUrl} alt="" className="aspect-[16/9] w-full object-cover" /> : <div className="flex aspect-[16/9] items-center justify-center bg-black/5"><ImageIcon className="size-6 opacity-40" /></div>}<div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-[var(--game-primary)]">{formatCategoryLabel(article.category)}</p><h3 className="mt-3 font-bold">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 opacity-70">{article.excerpt}</p></div></Link>)}</div></section> : null}
      {sections.includes('COMMUNITY_CTA') ? <section className="rounded-3xl bg-[var(--game-primary)] p-8 text-white sm:p-12"><div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{config.closing.eyebrow || 'Kết nối cộng đồng'}</p><h2 className="mt-3 text-3xl font-black">{config.closing.title || `Bước vào ${game.name}`}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/80">{config.closing.description || game.tagline}</p></div><Link href={portalUrl('/auth/register')} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[var(--game-primary)]">Đăng ký tài khoản <ArrowRight className="size-4" /></Link></div></section> : null}
    </div>
  </div>;
}

function CardGrid({ title, items }: { title: string; items: GamePageItem[] }) {
  return <section><SectionHeading title={title} /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <article key={`${item.title}-${index}`} className="overflow-hidden rounded-2xl border border-black/10 bg-white/55">{item.imageUrl ? <img src={item.imageUrl} alt="" className="aspect-[16/9] w-full object-cover" /> : null}<div className="p-6"><Sparkles className="size-5 text-[var(--game-primary)]" /><h3 className="mt-5 font-bold">{item.title}</h3>{item.description ? <p className="mt-2 text-sm leading-6 opacity-70">{item.description}</p> : null}</div></article>)}</div></section>;
}

function Gallery({ title, items }: { title: string; items: GamePageItem[] }) {
  return <section><SectionHeading title={title} /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => <figure key={`${item.title}-${index}`} className="overflow-hidden rounded-2xl border border-black/10 bg-white/55">{item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-black/5"><ImageIcon className="size-7 opacity-30" /></div>}<figcaption className="p-4"><p className="font-bold">{item.title}</p>{item.description ? <p className="mt-1 text-sm opacity-70">{item.description}</p> : null}</figcaption></figure>)}</div></section>;
}

function SectionHeading({ title }: { title: string }) { return <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">ZENX GO</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h2></div>; }
