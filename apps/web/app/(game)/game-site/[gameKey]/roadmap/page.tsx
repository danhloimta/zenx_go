'use client';

import { CheckCircle2, CircleDot } from 'lucide-react';
import { useGame } from '@/components/game/game-context';

export default function RoadmapPage() {
  const game = useGame();
  return <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--game-primary)]">Roadmap</p><h1 className="mt-4 text-4xl font-black sm:text-5xl">Lộ trình phát triển</h1>{game.milestones.length ? <div className="mt-12 space-y-4">{game.milestones.map((milestone) => <div key={milestone.title} className="flex gap-4 rounded-2xl border border-black/10 bg-white/55 p-5 sm:p-6"><div className="mt-1 text-[var(--game-primary)]">{milestone.status === 'COMPLETED' ? <CheckCircle2 className="size-5" /> : <CircleDot className="size-5" />}</div><div className="flex-1"><div className="flex flex-wrap justify-between gap-2 text-xs font-bold uppercase tracking-wider opacity-60"><span>{milestone.displayPeriod}</span><span>{milestone.status.replaceAll('_', ' ')}</span></div><h2 className="mt-3 text-xl font-bold">{milestone.title}</h2><p className="mt-2 text-sm leading-6 opacity-70">{milestone.description}</p>{milestone.checklist.length ? <ul className="mt-4 grid gap-2 text-sm opacity-75 sm:grid-cols-2">{milestone.checklist.map((item) => <li key={item}>✓ {item}</li>)}</ul> : null}</div></div>)}</div> : <div className="mt-10 rounded-2xl border border-dashed border-black/20 p-10 text-center opacity-70">Roadmap đang được cập nhật.</div>}</div>;
}
