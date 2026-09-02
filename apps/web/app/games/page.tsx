'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, RotateCcw } from 'lucide-react';
import type { GameLifecycleStatus } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { gameUrl } from '@/lib/domain';
import { Skeleton } from '@/components/ui/skeleton';


const genres = ['', 'MMORPG', 'FANTASY', 'STRATEGY', 'CASUAL', 'SIMULATION'];
const platforms = ['', 'PC', 'MOBILE', 'WEB'];
const statuses: Array<{ value: '' | GameLifecycleStatus; label: string }> = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'IN_DEVELOPMENT', label: 'Đang phát triển' },
  { value: 'COMING_SOON', label: 'Sắp ra mắt' },
  { value: 'CONCEPT', label: 'Concept' },
  { value: 'LIVE', label: 'Đang hoạt động' },
];

export default function GamesPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] px-4 py-20 text-center text-sm text-slate-500">Đang tải danh sách game…</div>}><GamesPageContent /></Suspense>;
}

function GamesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const genre = params.get('genre') ?? '';
  const platform = params.get('platform') ?? '';
  const status = (params.get('status') ?? '') as '' | GameLifecycleStatus;
  const query = useQuery({ queryKey: ['games', genre, platform, status], queryFn: () => api.games.list({ genre: genre || undefined, platform: platform || undefined, status: status || undefined }) });
  const updateFilter = (key: 'genre' | 'platform' | 'status', value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(`${pathname}${next.toString() ? `?${next.toString()}` : ''}`, { scroll: false });
  };
  const clear = () => router.replace(pathname, { scroll: false });
  return <main className="min-h-screen bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#00873E]">ZENX GO Game Hub</p><h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">Khám phá game</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Tìm thế giới phù hợp với thể loại, nền tảng và trạng thái phát hành bạn quan tâm.</p><div className="mt-8 flex flex-wrap gap-3"><SelectFilter label="Thể loại" value={genre} options={genres.map((value) => ({ value, label: value || 'Tất cả thể loại' }))} onChange={(value) => updateFilter('genre', value)} /><SelectFilter label="Nền tảng" value={platform} options={platforms.map((value) => ({ value, label: value || 'Tất cả nền tảng' }))} onChange={(value) => updateFilter('platform', value)} /><SelectFilter label="Trạng thái" value={status} options={statuses} onChange={(value) => updateFilter('status', value)} />{(genre || platform || status) ? <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:text-slate-900"><RotateCcw className="size-4" /> Xóa bộ lọc</button> : null}</div>{query.isLoading ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-96 rounded-3xl" />)}</div> : query.isError ? <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-sm text-red-700">Không thể tải danh sách game. Vui lòng thử lại.</div> : query.data?.items.length ? <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{query.data.items.map((game) => <Link key={game.slug} href={gameUrl(game.subdomain)} className="group overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-sm hover:-translate-y-1 hover:shadow-xl">{game.coverUrl || game.heroDesktopUrl ? <img src={game.coverUrl ?? game.heroDesktopUrl ?? ''} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="aspect-[16/10] bg-slate-800" />}<div className="p-5"><div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-300"><span>{game.lifecycleStatus.replaceAll('_', ' ')}</span>{game.recordType === 'DEMO' ? <span>Demo</span> : null}</div><h2 className="mt-3 text-xl font-black">{game.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{game.shortDescription}</p><div className="mt-5 flex items-center justify-between text-xs font-bold text-white/70"><span>{game.platforms.join(' · ')}</span><ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></div></div></Link>)}</div> : <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-600">Không có game phù hợp với bộ lọc hiện tại.<br /><button type="button" onClick={clear} className="mt-4 font-bold text-[#00873E]">Xóa bộ lọc</button></div>}</div></main>;
}

function SelectFilter({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500">{label}<select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent py-1 text-sm font-bold text-slate-800 outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
