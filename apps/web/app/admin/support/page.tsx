'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  HelpCircle,
  Inbox,
  LifeBuoy,
  RefreshCw,
  Ticket as TicketIcon,
  UserCheck,
} from 'lucide-react';
import { useSupportAdminDashboard, useSupportAdminTickets } from '@/hooks/use-support';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { UserAvatar } from '@/components/user-avatar';
import {
  supportPriorityClass,
  supportPriorityLabel,
  supportStatusClass,
  supportStatusLabel,
} from '@/lib/support';

const queueCards = [
  {
    key: 'unassigned',
    label: 'Cần phân công',
    desc: 'Chưa có người tiếp nhận',
    icon: Inbox,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
    href: '/admin/support/tickets?assignee=UNASSIGNED',
  },
  {
    key: 'assignedToMe',
    label: 'Ticket của tôi',
    desc: 'Được giao cho bạn xử lý',
    icon: UserCheck,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    href: '/admin/support/tickets?assignee=ME',
  },
  {
    key: 'unread',
    label: 'Tin nhắn chưa đọc',
    desc: 'Khách hàng đang chờ phản hồi',
    icon: CircleAlert,
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
    href: '/admin/support/tickets?unreadOnly=true',
  },
  {
    key: 'resolved',
    label: 'Đã giải quyết',
    desc: 'Xử lý thành công gần đây',
    icon: CheckCircle2,
    tone: 'bg-slate-50 text-slate-700 border-slate-200',
    href: '/admin/support/tickets?status=RESOLVED',
  },
];

export default function SupportAdminDashboardPage() {
  const dashboard = useSupportAdminDashboard();
  const tickets = useSupportAdminTickets({ page: 1, pageSize: 10 });

  if (dashboard.isLoading) return <SupportDashboardSkeleton />;

  if (dashboard.isError || !dashboard.data)
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-xs">
        <p className="font-bold">Không thể tải dữ liệu tổng quan hỗ trợ.</p>
        <p className="mt-1 text-xs text-rose-600">
          Vui lòng kiểm tra quyền hạn CS/Admin hoặc thử làm mới lại trang.
        </p>
      </div>
    );

  const stats = dashboard.data.tickets;
  const totalTickets =
    Object.values(stats.byStatus).reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0) ||
    tickets.data?.total ||
    0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Trung tâm Hỗ trợ Khách hàng
            </h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {totalTickets} tickets
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiếp nhận, phân luồng yêu cầu, trả lời ticket và quản lý cơ sở tri thức FAQ cho toàn bộ người chơi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void dashboard.refetch();
              void tickets.refetch();
            }}
            disabled={dashboard.isFetching || tickets.isFetching}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw
              className={`size-3.5 ${dashboard.isFetching || tickets.isFetching ? 'animate-spin' : ''}`}
            />
            Làm mới
          </Button>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Link href="/admin/support/faqs">
              <HelpCircle className="size-3.5 text-slate-500" /> Quản lý FAQ
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 text-xs gap-1.5 bg-[#00873E] text-white hover:bg-[#007033]">
            <Link href="/admin/support/tickets">
              <ClipboardList className="size-3.5" /> Hàng đợi xử lý
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Core Actionable Metrics Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {queueCards.map((card) => {
          const Icon = card.icon;
          const value =
            card.key === 'resolved'
              ? stats.byStatus.RESOLVED || 0
              : (stats[card.key as keyof typeof stats] as number) || 0;

          return (
            <Link
              key={card.key}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 group-hover:text-[#00873E]">
                    {card.label}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-2xl font-black tracking-tight text-slate-900">
                      {value}
                    </span>
                    {card.key === 'unread' && value > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                        <span className="size-1.5 rounded-full bg-rose-500 animate-ping" /> Cần xem
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{card.desc}</p>
                </div>
                <span
                  className={`flex size-10 items-center justify-center rounded-xl border ${card.tone} shadow-2xs transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-[#00873E]">
                Mở danh sách <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Tickets Section with Inline Status Tabs */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-xl bg-[#00873E]/10 text-[#00873E]">
                <TicketIcon className="size-4" />
              </span>
              <h3 className="text-base font-black text-slate-900">Yêu cầu vừa có hoạt động mới</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Danh sách các ticket nhận tin nhắn mới hoặc vừa được cập nhật workflow gần nhất.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <Link
                key={status}
                href={`/admin/support/tickets?status=${status}`}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-100 px-2.5 py-1 text-xs font-semibold transition hover:shadow-xs ${supportStatusClass(
                  status,
                )}`}
              >
                <span>{supportStatusLabel(status)}</span>
                <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-black text-slate-700 shadow-2xs">
                  {count}
                </span>
              </Link>
            ))}
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs font-bold text-[#00873E] hover:bg-[#00873E]/10 ml-1">
              <Link href="/admin/support/tickets">
                Tất cả <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        {tickets.isLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3, 4].map((value) => (
              <div key={value} className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : tickets.isError || !tickets.data ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Không thể tải danh sách ticket gần đây.
          </div>
        ) : tickets.data.items.length ? (
          <div className="divide-y divide-slate-100">
            {tickets.data.items.map((ticket) => (
              <Link
                key={ticket.ticketNo}
                href={`/admin/support/tickets/${encodeURIComponent(ticket.ticketNo)}`}
                className="group flex flex-col gap-3.5 px-6 py-4 transition-all hover:bg-slate-50/90 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: Avatar + Details */}
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative shrink-0">
                    <UserAvatar
                      id={ticket.user.id}
                      name={ticket.user.profile?.fullName}
                      username={ticket.user.username}
                      email={ticket.user.email}
                      avatarUrl={ticket.user.profile?.avatarUrl}
                      size="md"
                      className="ring-2 ring-slate-100 group-hover:ring-emerald-200 transition-all"
                    />
                    {ticket.unread ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"
                        title="Có tin nhắn chưa đọc"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 group-hover:bg-[#00873E]/10 group-hover:text-[#00873E] transition-colors">
                        {ticket.ticketNo}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supportPriorityClass(
                          ticket.priority,
                        )}`}
                      >
                        {supportPriorityLabel(ticket.priority)}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {ticket.category.name}
                      </span>
                      {ticket.unread ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
                          Chưa đọc
                        </span>
                      ) : null}
                    </div>

                    <h4 className="mt-1 text-sm font-bold text-slate-900 group-hover:text-[#00873E] transition-colors truncate">
                      {ticket.subject}
                    </h4>

                    <p className="mt-0.5 text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-700">
                        {ticket.user.profile?.fullName || ticket.user.username}
                      </span>
                      {ticket.user.email ? (
                        <span className="text-slate-400"> ({ticket.user.email})</span>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Right: Status, Assignee, Activity Time & Action Arrow */}
                <div className="flex shrink-0 items-center justify-between gap-4 sm:gap-6 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Status & Assignee */}
                  <div className="flex flex-col items-start sm:items-end">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${supportStatusClass(
                        ticket.status,
                      )}`}
                    >
                      {supportStatusLabel(ticket.status)}
                    </span>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <span className="text-slate-400">Phụ trách:</span>
                      <span
                        className={`font-semibold ${
                          ticket.assignee ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {ticket.assignee?.fullName || ticket.assignee?.username || 'Chưa nhận'}
                      </span>
                    </div>
                  </div>

                  {/* Activity Timestamp */}
                  <div className="hidden md:flex flex-col items-end min-w-[135px] text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-semibold text-slate-700">
                      <Clock3 className="size-3 text-slate-400 shrink-0" />
                      <span>{formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}</span>
                    </div>
                    <span className="mt-0.5 text-[10px] text-slate-400">Hoạt động gần nhất</span>
                  </div>

                  {/* Action Chevron */}
                  <div className="hidden sm:flex size-7 items-center justify-center rounded-lg text-slate-300 group-hover:bg-[#00873E]/10 group-hover:text-[#00873E] transition-all">
                    <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-300" />
            <p className="mt-3 text-base font-bold text-slate-800">Tất cả ticket đã được xử lý</p>
            <p className="mt-1 text-xs text-slate-500">
              Không có yêu cầu nào đang chờ xử lý trong danh sách gần đây.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function SupportDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((value) => (
          <Skeleton key={value} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-[480px] rounded-3xl" />
    </div>
  );
}
