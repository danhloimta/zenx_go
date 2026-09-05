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
  Sparkles,
  Ticket as TicketIcon,
  TrendingUp,
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
    label: 'Chưa nhận xử lý',
    desc: 'Cần phân công ngay',
    icon: Inbox,
    tone: 'bg-blue-50 text-blue-700 border-blue-100',
    href: '/admin/support/tickets?assignee=UNASSIGNED',
  },
  {
    key: 'assignedToMe',
    label: 'Ticket của tôi',
    desc: 'Được giao cho bạn',
    icon: UserCheck,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    href: '/admin/support/tickets?assignee=ME',
  },
  {
    key: 'new',
    label: 'Mới tiếp nhận',
    desc: 'Yêu cầu vừa tạo',
    icon: Sparkles,
    tone: 'bg-violet-50 text-violet-700 border-violet-100',
    href: '/admin/support/tickets?status=NEW',
  },
  {
    key: 'waitingUser',
    label: 'Chờ khách phản hồi',
    desc: 'Đã gửi câu trả lời',
    icon: Clock3,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
    href: '/admin/support/tickets?status=WAITING_USER',
  },
  {
    key: 'unread',
    label: 'Tin nhắn chưa đọc',
    desc: 'Khách vừa phản hồi',
    icon: CircleAlert,
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
    href: '/admin/support/tickets?unreadOnly=true',
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
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100/70 bg-gradient-to-r from-emerald-500/10 via-emerald-50/50 to-white p-6 sm:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00873E]/10 px-3 py-1 text-xs font-bold text-[#00873E]">
                <LifeBuoy className="size-3.5" /> Support Operations
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {totalTickets} tickets toàn hệ thống
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Trung tâm Hỗ trợ Khách hàng
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Tiếp nhận, phân luồng yêu cầu, trả lời ticket và quản lý cơ sở tri thức FAQ cho toàn bộ người chơi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void dashboard.refetch();
                void tickets.refetch();
              }}
              disabled={dashboard.isFetching || tickets.isFetching}
              className="gap-2 bg-white"
            >
              <RefreshCw
                className={`size-3.5 ${dashboard.isFetching || tickets.isFetching ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-2 bg-white">
              <Link href="/admin/support/faqs">
                <HelpCircle className="size-4 text-slate-500" /> Quản lý FAQ
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2 bg-[#00873E] text-white hover:bg-[#007033]">
              <Link href="/admin/support/tickets">
                <ClipboardList className="size-4" /> Mở hàng đợi xử lý
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Cần phân công</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-black text-blue-600">{stats.unassigned}</span>
              <span className="text-xs text-slate-400">chưa nhận</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Của bạn đang xử lý</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-600">{stats.assignedToMe}</span>
              <span className="text-xs text-slate-400">tickets</span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Tin nhắn chưa đọc</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-black text-rose-600">{stats.unread}</span>
              {stats.unread > 0 && (
                <span className="size-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-xs">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Đã giải quyết</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-black text-slate-800">{stats.byStatus.RESOLVED || 0}</span>
              <span className="text-xs text-slate-400">thành công</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Queue Filter Action Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {queueCards.map((card) => {
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
              href={card.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 group-hover:text-[#00873E]">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    {value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{card.desc}</p>
                </div>
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl border ${card.tone} shadow-2xs transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="size-5" />
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#00873E]">
                Mở danh sách <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Status Breakdown Pills */}
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
              <TrendingUp className="size-4" />
            </span>
            <h3 className="font-black text-slate-900">Tiến độ xử lý theo trạng thái</h3>
          </div>
          <span className="text-xs text-slate-400">Nhấp vào trạng thái để lọc nhanh</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {Object.entries(stats.byStatus).map(([status, value]) => (
            <Link
              key={status}
              href={`/admin/support/tickets?status=${status}`}
              className={`inline-flex items-center gap-2 rounded-2xl border border-slate-100 px-4 py-2 text-xs font-bold transition hover:shadow-xs ${supportStatusClass(
                status,
              )}`}
            >
              <span>{supportStatusLabel(status)}</span>
              <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-black text-slate-800 shadow-2xs">
                {value}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Tickets Section */}
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <TicketIcon className="size-4" />
              </span>
              <h3 className="font-black text-slate-900">Yêu cầu vừa có hoạt động mới</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Danh sách các ticket nhận tin nhắn mới hoặc vừa được cập nhật workflow gần nhất.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-xs font-bold text-[#00873E]">
            <Link href="/admin/support/tickets">
              Xem toàn bộ hàng đợi <ChevronRight className="size-4" />
            </Link>
          </Button>
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
                className="group flex flex-col gap-3 px-6 py-4.5 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* User Avatar + Ticket Title */}
                <div className="flex min-w-0 items-center gap-3.5">
                  <UserAvatar
                    id={ticket.user.id}
                    name={ticket.user.profile?.fullName}
                    username={ticket.user.username}
                    email={ticket.user.email}
                    avatarUrl={ticket.user.profile?.avatarUrl}
                    size="md"
                    className="shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#00873E]">
                        {ticket.ticketNo}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${supportPriorityClass(
                          ticket.priority,
                        )}`}
                      >
                        {supportPriorityLabel(ticket.priority)}
                      </span>
                      {ticket.unread ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Chưa đọc
                        </span>
                      ) : null}
                    </div>

                    <h4 className="mt-1 truncate font-bold text-slate-900 group-hover:text-[#00873E]">
                      {ticket.subject}
                    </h4>

                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {ticket.user.profile?.fullName || ticket.user.username}
                      </span>
                      <span>•</span>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.2 text-[11px] font-medium text-slate-600">
                        {ticket.category.name}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Info: Status & Assignee & Timestamp */}
                <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${supportStatusClass(
                          ticket.status,
                        )}`}
                      >
                        {supportStatusLabel(ticket.status)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-end gap-1.5 text-xs text-slate-400">
                      <span className="text-[11px]">Phụ trách:</span>
                      <span
                        className={`font-semibold ${
                          ticket.assignee ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {ticket.assignee?.fullName || ticket.assignee?.username || 'Chưa nhận'}
                      </span>
                    </div>
                  </div>

                  <div className="border-l border-slate-100 pl-3 text-right">
                    <span className="block text-xs font-semibold text-slate-600">
                      {formatDate(ticket.lastActivityAt ?? ticket.updatedAt)}
                    </span>
                    <span className="text-[10px] text-slate-400">hoạt động</span>
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
      <Skeleton className="h-32 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((value) => (
          <Skeleton key={value} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-24 rounded-3xl" />
      <Skeleton className="h-[480px] rounded-3xl" />
    </div>
  );
}
