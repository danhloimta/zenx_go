'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function GameAuditPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  const audit = useQuery({ queryKey: ['game-admin', 'audit', context.data?.game.id], queryFn: () => api.gameAdmin.audit(context.data!.game.id), enabled: Boolean(context.data), retry: false });
  if (!context.data || audit.isLoading) return <p className="text-sm text-slate-500">Đang tải nhật ký…</p>;
  if (audit.isError) return <p className="text-sm text-red-600">Bạn không có quyền xem nhật ký hoạt động.</p>;
  return <><div className="mb-7"><h1 className="text-3xl font-black">Nhật ký hoạt động</h1><p className="mt-1 text-sm text-slate-500">Các thay đổi vận hành trong {context.data.game.name}.</p></div><div className="divide-y overflow-hidden rounded-xl border border-slate-200 bg-white">{audit.data?.items.map((entry) => <details key={entry.id} className="group p-4"><summary className="cursor-pointer list-none"><div className="flex justify-between gap-4"><div><p className="font-semibold">{entry.action}</p><p className="mt-1 text-xs text-slate-500">{entry.actor?.displayName ?? 'Hệ thống'} · {entry.targetType}</p></div><time className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString('vi-VN')}</time></div></summary>{entry.reason ? <p className="mt-3 text-sm">Lý do: {entry.reason}</p> : null}<pre className="mt-3 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify({ before: entry.beforeData, after: entry.afterData }, null, 2)}</pre></details>)}{audit.data?.items.length === 0 ? <p className="p-6 text-sm text-slate-500">Chưa có hoạt động.</p> : null}</div></>;
}
