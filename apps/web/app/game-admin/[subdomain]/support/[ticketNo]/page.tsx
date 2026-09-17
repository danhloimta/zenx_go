'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SupportMessageText } from '@/components/support-markdown';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { formatDate } from '@/lib/utils';

export default function GameSupportTicketPage() {
  const { subdomain, ticketNo: rawTicketNo } = useParams<{
    subdomain: string;
    ticketNo: string;
  }>();
  const ticketNo = decodeURIComponent(rawTicketNo);
  const [body, setBody] = useState('');
  const client = useQueryClient();

  const context = useQuery({
    queryKey: ['game-admin', 'context', subdomain],
    queryFn: () => api.gameAdmin.context(subdomain),
    retry: false,
  });

  const ticket = useQuery({
    queryKey: ['game-admin', 'support', context.data?.game.id, ticketNo],
    queryFn: () => api.gameAdmin.support.ticket(context.data!.game.id, ticketNo),
    enabled: Boolean(context.data),
    retry: false,
  });

  const messages = useQuery({
    queryKey: ['game-admin', 'support-messages', context.data?.game.id, ticketNo],
    queryFn: () =>
      api.gameAdmin.support.messages(context.data!.game.id, ticketNo, { pageSize: 50 }),
    enabled: Boolean(context.data),
    retry: false,
  });

  const reply = useMutation({
    mutationFn: () =>
      api.gameAdmin.support.reply(context.data!.game.id, ticketNo, { body: body.trim() }),
    onSuccess: () => {
      setBody('');
      void client.invalidateQueries({ queryKey: ['game-admin', 'support'] });
      void client.invalidateQueries({
        queryKey: ['game-admin', 'support-messages', context.data!.game.id, ticketNo],
      });
    },
  });

  if (ticket.isLoading || messages.isLoading) {
    return <Skeleton className="h-[650px] rounded-2xl" />;
  }

  if (ticket.isError || messages.isError || !ticket.data) {
    return <Alert>Không thể tải yêu cầu hỗ trợ.</Alert>;
  }

  const item = ticket.data;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        icon={MessageSquare}
        eyebrow={
          <Link
            href={`/game-admin/${subdomain}/support`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00873E]"
          >
            <ArrowLeft className="size-3.5" /> Danh sách yêu cầu hỗ trợ
          </Link>
        }
        title={item.subject}
        badge={<StatusBadge status={item.status} />}
        description={`${item.ticketNo} · Chuyên mục: ${item.category.name} · Người gửi: ${item.user.fullName ?? item.user.username} (${item.user.email})`}
        className="border-b border-slate-100 pb-3"
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs">
        <p className="whitespace-pre-wrap rounded-xl bg-slate-50/80 border border-slate-100 p-4 text-sm leading-relaxed text-slate-800">
          {item.description}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Lịch sử trao đổi
        </h3>
        {messages.data?.items
          .slice()
          .reverse()
          .map((message) => (
            <div
              key={message.id}
              className={`rounded-xl p-4 border ${
                message.authorType === 'STAFF'
                  ? 'bg-emerald-50/70 border-emerald-100'
                  : 'bg-slate-50/70 border-slate-100'
              }`}
            >
              <p className="text-xs font-bold text-slate-800">
                {message.author?.fullName ??
                  message.author?.username ??
                  (message.authorType === 'STAFF' ? 'Quản trị viên' : 'Người chơi')}{' '}
                · <span className="font-normal text-slate-400">{formatDate(message.createdAt)}</span>
              </p>
              <div className="mt-2 text-sm text-slate-700">
                <SupportMessageText>{message.body}</SupportMessageText>
              </div>
            </div>
          ))}
      </section>

      {item.status !== 'CLOSED' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) reply.mutate();
          }}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
        >
          <label htmlFor="reply-body" className="text-xs font-bold text-slate-700">
            Gửi phản hồi cho người chơi
          </label>
          <Textarea
            id="reply-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            placeholder="Nhập nội dung phản hồi hướng dẫn người chơi…"
            className="mt-2 min-h-28 text-sm"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">{body.length}/4000 ký tự</span>
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim() || reply.isPending}
              className="h-8 px-3.5 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs"
            >
              <Send className="size-3.5 mr-1" />
              {reply.isPending ? 'Đang gửi…' : 'Gửi phản hồi'}
            </Button>
          </div>
          {reply.isError ? <Alert className="mt-3">Không thể gửi phản hồi.</Alert> : null}
        </form>
      ) : null}
    </div>
  );
}
