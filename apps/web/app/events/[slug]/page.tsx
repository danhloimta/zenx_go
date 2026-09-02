import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock3, Gift } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PortalPageLayout } from '@/components/portal/portal-page-layout';
import { getPortalEvent, getPortalGames } from '@/lib/game-api';
import { gameUrl, portalUrl } from '@/lib/domain';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPortalEvent(slug);
  if (!event) return { title: 'Sự kiện không tồn tại', robots: { index: false, follow: false } };
  return { title: event.seoTitle ?? event.title, description: event.seoDescription ?? event.excerpt, alternates: { canonical: portalUrl(`/events/${event.slug}`) }, openGraph: { title: event.seoTitle ?? event.title, description: event.seoDescription ?? event.excerpt, url: portalUrl(`/events/${event.slug}`), images: event.coverImageUrl ? [event.coverImageUrl] : undefined } };
}

export default async function PortalEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [event, games] = await Promise.all([getPortalEvent(slug), getPortalGames()]);
  if (!event) notFound();
  return <PortalPageLayout games={games}><article className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl"><Link href="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Tất cả sự kiện</Link><div className="mt-10 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-[#00873E]"><Gift className="size-4" /><span>{eventStatusLabel(event.status)}</span>{event.game ? <><span className="text-slate-300">•</span><span className="text-slate-500">{event.game.name}</span></> : null}</div><h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">{event.title}</h1><div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500"><span className="inline-flex items-center gap-2"><CalendarDays className="size-4" /> {formatDate(event.startsAt)}</span>{event.endsAt ? <span className="inline-flex items-center gap-2"><Clock3 className="size-4" /> đến {formatDate(event.endsAt)}</span> : null}</div>{event.coverImageUrl ? <img src={event.coverImageUrl} alt={event.title} className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" /> : null}<div className="prose prose-slate mt-10 max-w-none leading-8" dangerouslySetInnerHTML={{ __html: withoutLeadingTitle(event.contentHtml) }} />{event.game ? <div className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950"><p>Đây là sự kiện của {event.game.name}.</p><Link href={gameUrl(event.game.subdomain)} className="mt-3 inline-flex items-center gap-2 font-bold text-[#00873E]">Mở trang game <span>→</span></Link></div> : null}</div></article></PortalPageLayout>;
}

function eventStatusLabel(status: 'ACTIVE' | 'UPCOMING' | 'ENDED') {
  return status === 'ACTIVE' ? 'Đang diễn ra' : status === 'UPCOMING' ? 'Sắp diễn ra' : 'Đã kết thúc';
}

function formatDate(value?: string | null) {
  if (!value) return 'Chưa cập nhật';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function withoutLeadingTitle(contentHtml: string) {
  return contentHtml.replace(/^\s*<h1>[^<]*<\/h1>/i, '');
}
