'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAdminDashboard, useAdminMe } from '@/hooks/use-admin';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { AdminAuditLog, AdminUserSummary } from '@zenx-go/api-client';

const statusMeta: Record<string, { label: string; className: string; icon: typeof Users }> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    className: 'bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  PENDING: { label: 'Chờ xác minh', className: 'bg-amber-50 text-amber-700', icon: Clock3 },
  LOCKED: { label: 'Bị khóa', className: 'bg-red-50 text-red-700', icon: ShieldAlert },
  SUSPENDED: { label: 'Tạm ngưng', className: 'bg-slate-100 text-slate-700', icon: Ban },
};

export default function AdminDashboardPage() {
  const admin = useAdminMe();
  const dashboard = useAdminDashboard(Boolean(admin.data));
  if (dashboard.isLoading) return <DashboardSkeleton />;
  if (dashboard.isError || !dashboard.data)
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Không thể tải dữ liệu tổng quan. Vui lòng thử lại.
      </div>
    );
  const data = dashboard.data;
  const cards = [
    {
      label: 'Tổng người dùng',
      value: data.users.total,
      icon: Users,
      tone: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Đang hoạt động',
      value: data.users.byStatus.ACTIVE ?? 0,
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Tạm ngưng',
      value: data.users.byStatus.SUSPENDED ?? 0,
      icon: Ban,
      tone: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Đăng ký 7 ngày',
      value: data.users.registeredLast7Days,
      icon: UserPlus,
      tone: 'bg-violet-50 text-violet-700',
    },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#00873E]">
            Xin chào, {admin.data?.profile?.fullName || admin.data?.username || 'quản trị viên'}.
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Tổng quan vận hành
          </h2>
          <p className="mt-1 text-sm text-slate-500">Theo dõi nhanh tình hình tài khoản ZENX GO.</p>
        </div>
        <Button asChild variant="zenx-outline" size="sm">
          <Link href="/admin/users" className="gap-2">
            Quản lý người dùng <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    {card.value.toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className={`flex size-11 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="size-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-slate-900">Người dùng mới</h3>
              <p className="mt-0.5 text-xs text-slate-500">10 tài khoản đăng ký gần nhất</p>
            </div>
            <Link href="/admin/users" className="text-xs font-bold text-[#00873E] hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentUsers.length ? (
              data.recentUsers.map((user) => <UserRow key={user.id} user={user} />)
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">Chưa có người dùng.</p>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-slate-900">Hoạt động admin</h3>
              <p className="mt-0.5 text-xs text-slate-500">Nhật ký mới nhất</p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-bold text-[#00873E] hover:underline"
            >
              Mở nhật ký
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.recentActivity.length ? (
              data.recentActivity.map((entry) => <ActivityRow key={entry.id} entry={entry} />)
            ) : (
              <p className="p-8 text-center text-sm text-slate-500">Chưa có hoạt động.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function UserRow({ user }: { user: AdminUserSummary }) {
  const meta = statusMeta[user.status ?? ''] ?? statusMeta.PENDING;
  const Icon = meta.icon;
  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-800">
          {user.profile?.fullName || user.username}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          @{user.username} · {user.email}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${meta.className}`}
        >
          <Icon className="size-3" />
          {meta.label}
        </span>
        <span className="text-[11px] text-slate-400">{formatDate(user.createdAt)}</span>
      </div>
    </Link>
  );
}

function ActivityRow({ entry }: { entry: AdminAuditLog }) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
          <ShieldCheck className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">{auditLabel(entry.action)}</p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
            {entry.actorUsername ?? 'admin'} · {entry.reason}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">{formatDate(entry.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function auditLabel(action: string) {
  return (
    (
      {
        PROFILE_UPDATED: 'Cập nhật hồ sơ',
        STATUS_CHANGED: 'Đổi trạng thái tài khoản',
        SESSIONS_REVOKED: 'Thu hồi phiên đăng nhập',
        PASSWORD_RESET: 'Đặt mật khẩu tạm',
        SENSITIVE_PROFILE_REVEALED: 'Xem CCCD',
      } as Record<string, string>
    )[action] ?? action
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((value) => (
          <Skeleton key={value} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[420px] rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    </div>
  );
}
