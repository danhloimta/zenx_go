'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CircleAlert,
  ClipboardList,
  Inbox,
  LifeBuoy,
  Plus,
  UserCheck,
} from 'lucide-react';
import { useSupportAdminDashboard, useSupportAdminTickets } from '@/hooks/use-support';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import {
  supportPriorityClass,
  supportPriorityLabel,
  supportStatusClass,
  supportStatusLabel,
} from '@/lib/support';

const cards = [
  { key: 'unassigned', label: 'Chưa nhận', icon: Inbox, tone: 'bg-blue-50 text-blue-700' },
  {
    key: 'assignedToMe',
    label: 'Ticket của tôi',
    icon: UserCheck,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  { key: 'new', label: 'Mới tiếp nhận', icon: Inbox, tone: 'bg-violet-50 text-violet-700' },
  {
    key: 'waitingUser',
    label: 'Chờ phản hồi',
    icon: CircleAlert,
    tone: 'bg-amber-50 text-amber-700',
  },
  { key: 'unread', label: 'Chưa đọc', icon: CircleAlert, tone: 'bg-red-50 text-red-700' },
];

export default function SupportAdminDashboardPage() {
  const dashboard = useSupportAdminDashboard();
  const tickets = useSupportAdminTickets({ page: 1, pageSize: 10 });
  if (dashboard.isLoading) return <SupportDashboardSkeleton />;
  if (dashboard.isError || !dashboard.data)
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Không thể tải tổng quan hỗ trợ.
      </div>
    );
  const stats = dashboard.data.tickets;
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#00873E]">Support Operations</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Trung tâm hỗ trợ
          </h2>
          <p className="mt-1 text-sm text-slate-500">Tiếp nhận và xử lý yêu cầu khách hàng.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/support/faqs">
              <LifeBuoy className="size-4" /> Quản lý FAQ
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/support/tickets">
              <ClipboardList className="size-4" /> Mở hàng đợi
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          const value =
            card.key === 'new'
              ? stats.byStatus.NEW
              : card.key === 'waitingUser'
                ? stats.byStatus.WAITING_USER
                : (stats[card.key as keyof typeof stats] as number);
          return (
            <Link
              key={card.key}
              href={`/admin/support/tickets?${card.key === 'unassigned' ? 'assignee=UNASSIGNED' : card.key === 'assignedToMe' ? 'assignee=ME' : card.key === 'new' ? 'status=NEW' : card.key === 'waitingUser' ? 'status=WAITING_USER' : 'unreadOnly=true'}`}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">
                    {value}
                  </p>
                </div>
                <span
                  className={`flex size-11 items-center justify-center rounded-xl ${card.tone}`}
                >
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 flex items-center gap-1 text-xs font-bold text-[#00873E]">
                Xem hàng đợi <ArrowRight className="size-3.5" />
              </p>
            </Link>
          );
        })}
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-black text-slate-900">Ticket gần đây</h3>
            <p className="mt-1 text-xs text-slate-500">Sắp xếp theo hoạt động mới nhất.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/support/tickets">
              Xem tất cả <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {tickets.isLoading ? (
          <div className="space-y-2 p-5">
            {[1, 2, 3, 4].map((value) => (
              <Skeleton key={value} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : tickets.isError || !tickets.data ? (
          <p className="p-8 text-center text-sm text-slate-500">Không thể tải ticket.</p>
        ) : tickets.data.items.length ? (
          <div className="divide-y divide-slate-100">
            {tickets.data.items.map((ticket) => (
              <Link
                key={ticket.ticketNo}
                href={`/admin/support/tickets/${encodeURIComponent(ticket.ticketNo)}`}
                className="flex flex-col gap-2 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#00873E]">{ticket.ticketNo}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supportPriorityClass(ticket.priority)}`}
                    >
                      {supportPriorityLabel(ticket.priority)}
                    </span>
                    {ticket.unread ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        Chưa đọc
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-slate-800">{ticket.subject}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {ticket.user.profile?.fullName || ticket.user.username} · {ticket.category.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${supportStatusClass(ticket.status)}`}
                  >
                    {supportStatusLabel(ticket.status)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-sm text-slate-500">
            <Plus className="mx-auto size-8 text-slate-300" />
            <p className="mt-2">Chưa có ticket.</p>
          </div>
        )}
      </section>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="font-black text-slate-900">Theo trạng thái</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(stats.byStatus).map(([status, value]) => (
            <span
              key={status}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${supportStatusClass(status)}`}
            >
              {supportStatusLabel(status)}: {value}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function SupportDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((value) => (
          <Skeleton key={value} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[480px] rounded-2xl" />
    </div>
  );
}
