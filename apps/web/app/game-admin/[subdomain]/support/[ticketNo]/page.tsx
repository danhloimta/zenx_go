'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SupportMessageText } from '@/components/support-markdown';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';

export default function GameSupportTicketPage() {
  const { subdomain, ticketNo: rawTicketNo } = useParams<{ subdomain: string; ticketNo: string }>();
  const ticketNo = decodeURIComponent(rawTicketNo);
  const [body, setBody] = useState(''); const client = useQueryClient();
  const context = useQuery({ queryKey: ['game-admin', 'context', subdomain], queryFn: () => api.gameAdmin.context(subdomain), retry: false });
  const ticket = useQuery({ queryKey: ['game-admin', 'support', context.data?.game.id, ticketNo], queryFn: () => api.gameAdmin.support.ticket(context.data!.game.id, ticketNo), enabled: Boolean(context.data), retry: false });
  const messages = useQuery({ queryKey: ['game-admin', 'support-messages', context.data?.game.id, ticketNo], queryFn: () => api.gameAdmin.support.messages(context.data!.game.id, ticketNo, { pageSize: 50 }), enabled: Boolean(context.data), retry: false });
  const reply = useMutation({ mutationFn: () => api.gameAdmin.support.reply(context.data!.game.id, ticketNo, { body: body.trim() }), onSuccess: () => { setBody(''); void client.invalidateQueries({ queryKey: ['game-admin', 'support'] }); void client.invalidateQueries({ queryKey: ['game-admin', 'support-messages', context.data!.game.id, ticketNo] }); } });
  if (ticket.isLoading || messages.isLoading) return <Skeleton className="h-[650px] rounded-2xl" />;
  if (ticket.isError || messages.isError || !ticket.data) return <Alert>Không thể tải yêu cầu hỗ trợ.</Alert>;
  const item = ticket.data;
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/admin/support" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700"><ArrowLeft className="size-4" />Danh sách hỗ trợ</Link><section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex justify-between gap-4"><div><p className="text-xs font-bold text-emerald-700">{item.ticketNo} · {item.category.name}</p><h1 className="mt-2 text-2xl font-black">{item.subject}</h1><p className="mt-2 text-sm text-slate-500">{item.user.fullName ?? item.user.username} · {item.user.email}</p></div><StatusBadge status={item.status} /></div><p className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6">{item.description}</p></section><section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">{messages.data?.items.slice().reverse().map((message) => <div key={message.id} className={`rounded-xl p-4 ${message.authorType === 'STAFF' ? 'bg-emerald-50' : 'bg-slate-50'}`}><p className="text-xs font-bold">{message.author?.fullName ?? message.author?.username ?? (message.authorType === 'STAFF' ? 'Hỗ trợ' : 'Player')} · {formatDate(message.createdAt)}</p><SupportMessageText>{message.body}</SupportMessageText></div>)}</section>{item.status !== 'CLOSED' ? <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) reply.mutate(); }} className="rounded-2xl border border-slate-200 bg-white p-5"><Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} placeholder="Nhập phản hồi cho người chơi…" className="min-h-28" /><div className="mt-3 flex justify-end"><Button type="submit" disabled={!body.trim() || reply.isPending}><Send className="size-4" /> Gửi phản hồi</Button></div>{reply.isError ? <Alert className="mt-3">Không thể gửi phản hồi.</Alert> : null}</form> : null}</div>;
}
