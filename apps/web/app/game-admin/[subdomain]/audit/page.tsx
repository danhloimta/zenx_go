'use client';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GameAuditEntry } from '@zenx-go/api-client';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type FilterKey = 'action' | 'actor' | 'from' | 'to' | 'page' | 'pageSize';

export default function GameAuditPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<GameAuditEntry | null>(null);
  const filters = useMemo(() => ({ action: searchParams.get('action') ?? '', actor: searchParams.get('actor') ?? '', from: searchParams.get('from') ?? '', to: searchParams.get('to') ?? '', page: Math.max(1, Number(searchParams.get('page') ?? '1') || 1), pageSize: searchParams.get('pageSize') === '50' ? 50 as const : 20 as const }), [searchParams]);
  const setFilter = (key: FilterKey, value: string | number) => { const next = new URLSearchParams(searchParams.toString()); if (!value || (key === 'page' && value === 1) || (key === 'pageSize' && value === 20)) next.delete(key); else next.set(key, String(value)); if (key !== 'page') next.delete('page'); router.replace(`${pathname}${next.size ? `?${next}` : ''}`); };
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  const audit = useQuery({ queryKey: ['game-admin', 'audit', context.data?.game.id, filters], queryFn: () => api.gameAdmin.audit(context.data!.game.id, { page: filters.page, pageSize: filters.pageSize, action: filters.action || undefined, actorUserId: filters.actor || undefined, from: filters.from || undefined, to: filters.to || undefined }), enabled: Boolean(context.data), retry: false });
  if (context.isLoading || !context.data) return <p className="text-sm text-slate-500">Đang tải nhật ký…</p>;
  if (context.isError || audit.isError) return <p className="text-sm text-red-600">Bạn không có quyền xem nhật ký hoạt động.</p>;
  const totalPages = Math.max(1, Math.ceil((audit.data?.total ?? 0) / filters.pageSize));
  return <><div className="mb-7"><h1 className="text-3xl font-black">Nhật ký hoạt động</h1><p className="mt-1 text-sm text-slate-500">Các thay đổi vận hành trong {context.data.game.name}.</p></div>
    <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5"><Input value={filters.action} onChange={(event) => setFilter('action', event.target.value)} placeholder="Action" /><Input value={filters.actor} onChange={(event) => setFilter('actor', event.target.value)} placeholder="Actor user ID" /><Input type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} aria-label="Từ ngày" /><Input type="date" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} aria-label="Đến ngày" /><select className="rounded-lg border border-slate-200 px-3 text-sm" value={filters.pageSize} onChange={(event) => setFilter('pageSize', Number(event.target.value))}><option value={20}>20 / trang</option><option value={50}>50 / trang</option></select></div>
    {audit.isLoading ? <p className="text-sm text-slate-500">Đang tải hoạt động…</p> : <div className="divide-y overflow-hidden rounded-xl border border-slate-200 bg-white">{audit.data?.items.map((entry) => <button type="button" key={entry.id} onClick={() => setSelected(entry)} className="flex w-full justify-between gap-4 p-4 text-left hover:bg-slate-50"><div><p className="font-semibold">{entry.action}</p><p className="mt-1 text-xs text-slate-500">{entry.actor?.displayName ?? 'Hệ thống'} · {entry.targetType}</p></div><time className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString('vi-VN')}</time></button>)}{audit.data?.items.length === 0 ? <p className="p-6 text-sm text-slate-500">Không có hoạt động phù hợp với bộ lọc.</p> : null}</div>}
    <div className="mt-5 flex items-center justify-between text-sm"><span className="text-slate-500">Trang {filters.page} / {totalPages} · {audit.data?.total ?? 0} hoạt động</span><div className="flex gap-2"><Button variant="outline" disabled={filters.page <= 1} onClick={() => setFilter('page', filters.page - 1)}>Trước</Button><Button variant="outline" disabled={filters.page >= totalPages} onClick={() => setFilter('page', filters.page + 1)}>Sau</Button></div></div>
    {selected ? <AuditDetail entry={selected} onClose={() => setSelected(null)} /> : null}
  </>;
}

function AuditDetail({ entry, onClose }: { entry: GameAuditEntry; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" role="dialog" aria-modal="true"><aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{entry.action}</h2><p className="mt-1 text-sm text-slate-500">{entry.actor?.displayName ?? 'Hệ thống'} · {new Date(entry.createdAt).toLocaleString('vi-VN')}</p></div><Button variant="outline" onClick={onClose}>Đóng</Button></div><dl className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-slate-500">Loại đối tượng</dt><dd className="font-medium">{entry.targetType}</dd></div><div><dt className="text-slate-500">Đối tượng</dt><dd className="font-mono text-xs">{entry.targetId ?? '—'}</dd></div></dl>{entry.reason ? <section className="mt-6"><h3 className="font-bold">Lý do</h3><p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">{entry.reason}</p></section> : null}<section className="mt-6"><h3 className="font-bold">Trước thay đổi</h3><Json value={entry.beforeData} /></section><section className="mt-6"><h3 className="font-bold">Sau thay đổi</h3><Json value={entry.afterData} /></section></aside></div>;
}

function Json({ value }: { value: unknown }) { return <pre className="mt-2 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(value, null, 2) ?? '—'}</pre>; }
