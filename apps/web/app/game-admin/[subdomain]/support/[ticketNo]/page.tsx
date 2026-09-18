'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock3, LifeBuoy, Send, ShieldCheck, User } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { SupportMessageText } from '@/components/support-markdown';
import { PageHeader } from '@/components/page-header';
import { UserAvatar } from '@/components/user-avatar';
import { formatDate } from '@/lib/utils';
import {
  supportPriorityClass,
  supportPriorityLabel,
  supportStatusClass,
  supportStatusLabel,
} from '@/lib/support';

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
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (ticket.isError || messages.isError || !ticket.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00873E]"
        >
          <ArrowLeft className="size-3.5" /> Danh sách yêu cầu hỗ trợ
        </Link>
        <Alert>Không thể tải yêu cầu hỗ trợ.</Alert>
      </div>
    );
  }

  const item = ticket.data;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <PageHeader
        icon={LifeBuoy}
        eyebrow={
          <Link
            href="/admin/support"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00873E] transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Danh sách yêu cầu hỗ trợ
          </Link>
        }
        title={item.subject}
        badge={
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${supportStatusClass(
              item.status,
            )}`}
          >
            {supportStatusLabel(item.status)}
          </span>
        }
        description={
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
              {item.ticketNo}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supportPriorityClass(
                item.priority,
              )}`}
            >
              {supportPriorityLabel(item.priority)}
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {item.category.name}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-500">
              Gửi lúc {formatDate(item.createdAt)}
            </span>
          </div>
        }
        className="border-b border-slate-100 pb-3"
      />

      {/* Customer Info & Original Description Card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <UserAvatar
              id={item.user.id ?? ''}
              name={item.user.fullName ?? item.user.username}
              username={item.user.username}
              email={item.user.email ?? undefined}
              avatarUrl={item.user.avatarUrl ?? undefined}
              size="md"
              className="ring-2 ring-white shadow-2xs"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">
                {item.user.fullName || item.user.username}
                <span className="ml-1 text-slate-400 font-normal">(@{item.user.username})</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {item.user.email ? <span>{item.user.email}</span> : null}
                {item.user.phone ? <span className="ml-2">· {item.user.phone}</span> : null}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock3 className="size-3.5" />
            <span>Cập nhật: {formatDate(item.lastActivityAt ?? item.updatedAt)}</span>
          </div>
        </div>

        <div className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Nội dung yêu cầu ban đầu
          </h4>
          <p className="whitespace-pre-wrap rounded-xl bg-slate-50/80 border border-slate-100 p-4 text-sm leading-relaxed text-slate-800">
            {item.description}
          </p>
        </div>
      </section>

      {/* Message History */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lịch sử trao đổi ({messages.data?.items.length ?? 0} phản hồi)
          </h3>
        </div>

        {messages.data?.items && messages.data.items.length > 0 ? (
          <div className="space-y-3.5">
            {messages.data.items
              .slice()
              .reverse()
              .map((message) => {
                const isStaff = message.authorType === 'STAFF';

                return (
                  <div
                    key={message.id}
                    className={`rounded-2xl p-4 border transition-all ${
                      isStaff
                        ? 'bg-emerald-50/50 border-emerald-100 ml-4 sm:ml-8'
                        : 'bg-slate-50/70 border-slate-100 mr-4 sm:mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100/80 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex size-6 items-center justify-center rounded-lg text-xs font-bold ${
                            isStaff
                              ? 'bg-[#00873E] text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isStaff ? (
                            <ShieldCheck className="size-3.5" />
                          ) : (
                            <User className="size-3.5" />
                          )}
                        </span>
                        <p className="text-xs font-bold text-slate-800">
                          {message.author?.fullName ??
                            message.author?.username ??
                            (isStaff ? 'Quản trị viên' : 'Người chơi')}
                          {isStaff ? (
                            <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                              CSKH / Admin
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock3 className="size-3" />
                        {formatDate(message.createdAt)}
                      </span>
                    </div>

                    <div className="text-sm text-slate-800 leading-relaxed">
                      <SupportMessageText>{message.body}</SupportMessageText>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            Chưa có tin nhắn phản hồi nào cho ticket này.
          </div>
        )}
      </section>

      {/* Reply Input Form */}
      {item.status !== 'CLOSED' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) reply.mutate();
          }}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <label htmlFor="reply-body" className="text-xs font-bold text-slate-700">
              Gửi phản hồi cho người chơi
            </label>
            <span className="text-xs text-slate-400">{body.length}/4000 ký tự</span>
          </div>

          <Textarea
            id="reply-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
            placeholder="Nhập nội dung phản hồi hướng dẫn người chơi (hỗ trợ định dạng Markdown cơ bản)…"
            className="min-h-28 text-sm"
          />

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">
              Sau khi gửi, ticket sẽ tự động chuyển sang trạng thái &quot;Chờ phản hồi&quot;.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim() || reply.isPending}
              className="h-8.5 px-4 rounded-xl font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs"
            >
              <Send className="size-3.5 mr-1.5" />
              {reply.isPending ? 'Đang gửi…' : 'Gửi phản hồi'}
            </Button>
          </div>

          {reply.isError ? (
            <Alert className="mt-2 text-xs">Không thể gửi phản hồi. Vui lòng thử lại.</Alert>
          ) : null}
        </form>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
          Yêu cầu hỗ trợ này đã được đóng. Không thể gửi thêm phản hồi mới.
        </div>
      )}
    </div>
  );
}
