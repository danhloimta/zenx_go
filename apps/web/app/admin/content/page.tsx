'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, FileText, Gamepad2, Megaphone } from 'lucide-react';
import { useAdminContentDashboard } from '@/hooks/use-content';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const cards = [
  { key: 'games', label: 'Game', icon: Gamepad2, href: '/admin/content/games', tone: 'bg-blue-50 text-blue-700' },
  { key: 'articles', label: 'Bài viết', icon: FileText, href: '/admin/content/articles', tone: 'bg-emerald-50 text-emerald-700' },
  { key: 'events', label: 'Sự kiện', icon: CalendarDays, href: '/admin/content/events', tone: 'bg-violet-50 text-violet-700' },
  { key: 'announcements', label: 'Thông báo', icon: Megaphone, href: '/admin/content/announcements', tone: 'bg-amber-50 text-amber-700' },
] as const;

export default function AdminContentDashboardPage() {
  const query = useAdminContentDashboard();
  if (query.isLoading) return <ContentDashboardSkeleton />;
  if (query.isError || !query.data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        Không thể tải tổng quan nội dung.
      </div>
    );
  }
  const stats = query.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#00873E]">Content CMS</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Quản lý nội dung</h2>
          <p className="mt-1 text-sm text-slate-500">
            Chỉnh sửa nội dung portal và game đang có.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/content/articles/new">Tạo bài viết</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value =
            card.key === 'games'
              ? stats.games.total
              : card.key === 'articles'
                ? stats.articles.published + stats.articles.draft
              : card.key === 'events'
                  ? stats.events.active + stats.events.upcoming
                  : stats.announcements.draft + stats.announcements.published;
          return (
            <Link
              key={card.key}
              href={card.href}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
                </div>
                <span className={`flex size-11 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 flex items-center gap-1 text-xs font-bold text-[#00873E]">
                Mở quản lý <ArrowRight className="size-3.5" />
              </p>
            </Link>
          );
        })}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-black text-slate-900">Trạng thái game</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Đang public" value={stats.games.public} />
            <Stat label="Đang ẩn" value={stats.games.private} />
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-black text-slate-900">Trạng thái nội dung</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Bài viết nháp" value={stats.articles.draft} />
            <Stat label="Bài viết đã publish" value={stats.articles.published} />
            <Stat label="Sự kiện đang diễn ra" value={stats.events.active} />
            <Stat label="Sự kiện sắp tới" value={stats.events.upcoming} />
          </div>
        </section>
      </div>
      <p className="text-xs text-slate-400">
        Nội dung trang chủ có thể mất tối đa 60 giây để cập nhật do cache hiện tại.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function ContentDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((value) => <Skeleton key={value} className="h-36 rounded-2xl" />)}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );
}
