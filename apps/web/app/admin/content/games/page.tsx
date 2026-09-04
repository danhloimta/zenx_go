'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Gamepad2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { GameLifecycleStatus, GameOperationalStatus } from '@zenx-go/api-client';
import { useAdminContentGames } from '@/hooks/use-content';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

const lifecycleOptions: Array<{ value: '' | GameLifecycleStatus; label: string }> = [
  { value: '', label: 'Tất cả vòng đời' },
  { value: 'CONCEPT', label: 'Ý tưởng' },
  { value: 'IN_DEVELOPMENT', label: 'Đang phát triển' },
  { value: 'INTERNAL_TEST', label: 'Test nội bộ' },
  { value: 'CLOSED_BETA', label: 'Closed beta' },
  { value: 'OPEN_BETA', label: 'Open beta' },
  { value: 'LIVE', label: 'Đang vận hành' },
  { value: 'COMING_SOON', label: 'Sắp ra mắt' },
  { value: 'SUNSET', label: 'Đã đóng' },
];
const operationalOptions: Array<{ value: '' | GameOperationalStatus; label: string }> = [
  { value: '', label: 'Tất cả vận hành' },
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'DEGRADED', label: 'Suy giảm' },
  { value: 'UNAVAILABLE', label: 'Không khả dụng' },
];

export default function AdminContentGamesPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [lifecycleStatus, setLifecycleStatus] = useState<'' | GameLifecycleStatus>('');
  const [operationalStatus, setOperationalStatus] = useState<'' | GameOperationalStatus>('');
  const [visibility, setVisibility] = useState<'' | 'PUBLIC' | 'PRIVATE'>('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const query = useMemo(
    () => ({
      page,
      pageSize: 20,
      search: debounced || undefined,
      lifecycleStatus: lifecycleStatus || undefined,
      operationalStatus: operationalStatus || undefined,
      isPublic: visibility === 'PUBLIC' ? true : visibility === 'PRIVATE' ? false : undefined,
    }),
    [debounced, lifecycleStatus, operationalStatus, page, visibility],
  );
  const games = useAdminContentGames(query);
  const totalPages = Math.max(1, games.data?.totalPages ?? 1);
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#00873E]">Content CMS</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Game</h2>
        <p className="mt-1 text-sm text-slate-500">
          Chỉnh sửa nội dung cơ bản của game đã có; code và hostname luôn ở chế độ chỉ đọc.
        </p>
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_190px_180px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, code hoặc slug…"
              className="pl-10"
              aria-label="Tìm game"
            />
          </div>
          <Select
            value={lifecycleStatus}
            onChange={(event) => {
              setLifecycleStatus(event.target.value as '' | GameLifecycleStatus);
              setPage(1);
            }}
            aria-label="Lọc vòng đời"
          >
            {lifecycleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Select
            value={operationalStatus}
            onChange={(event) => {
              setOperationalStatus(event.target.value as '' | GameOperationalStatus);
              setPage(1);
            }}
            aria-label="Lọc trạng thái vận hành"
          >
            {operationalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
          <Select
            value={visibility}
            onChange={(event) => {
              setVisibility(event.target.value as '' | 'PUBLIC' | 'PRIVATE');
              setPage(1);
            }}
            aria-label="Lọc hiển thị"
          >
            <option value="">Tất cả hiển thị</option>
            <option value="PUBLIC">Đang public</option>
            <option value="PRIVATE">Đang ẩn</option>
          </Select>
        </div>
      </section>
      {games.isLoading ? (
        <GameSkeleton />
      ) : games.isError || !games.data ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          Không thể tải danh sách game.
        </div>
      ) : (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Game</th>
                    <th className="px-5 py-3">Vòng đời</th>
                    <th className="px-5 py-3">Vận hành</th>
                    <th className="px-5 py-3">Hiển thị</th>
                    <th className="px-5 py-3">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {games.data.items.map((game) => (
                    <tr key={game.id} className="group hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <Link href={`/admin/content/games/${game.id}`} className="flex items-center gap-3">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]"><Gamepad2 className="size-4" /></span>
                          <span>
                            <span className="block font-bold text-slate-800 group-hover:text-[#00873E]">{game.name}</span>
                            <span className="mt-1 block text-xs text-slate-400">{game.code} · {game.slug}</span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">{lifecycleLabel(game.lifecycleStatus)}</td>
                      <td className="px-5 py-4 text-xs text-slate-600">{operationalLabel(game.operationalStatus)}</td>
                      <td className="px-5 py-4"><VisibilityBadge isPublic={game.isPublic} /></td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatDate(game.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-4 md:hidden">
              {games.data.items.map((game) => (
                <Link key={game.id} href={`/admin/content/games/${game.id}`} className="block rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-xs font-bold text-[#00873E]">{game.code}</p><h3 className="mt-1 truncate font-bold text-slate-900">{game.name}</h3><p className="mt-1 truncate text-xs text-slate-400">{game.slug}</p></div>
                    <VisibilityBadge isPublic={game.isPublic} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{lifecycleLabel(game.lifecycleStatus)}</span><span>{formatDate(game.updatedAt)}</span></div>
                </Link>
              ))}
            </div>
            {!games.data.items.length ? <p className="p-12 text-center text-sm text-slate-500">Không có game phù hợp.</p> : null}
          </section>
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
            <span>{games.data.total.toLocaleString('vi-VN')} game</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || games.isFetching}><ChevronLeft className="size-4" /> Trước</Button>
              <span className="min-w-24 text-center font-semibold text-slate-700">Trang {games.data.page} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)} disabled={page >= totalPages || games.isFetching}>Sau <ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isPublic ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{isPublic ? 'Public' : 'Đang ẩn'}</span>;
}

function lifecycleLabel(value: string) {
  return lifecycleOptions.find((option) => option.value === value)?.label ?? value;
}

function operationalLabel(value: string) {
  return operationalOptions.find((option) => option.value === value)?.label ?? value;
}

function GameSkeleton() {
  return <div className="space-y-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">{[1, 2, 3, 4].map((value) => <Skeleton key={value} className="h-16 rounded-xl" />)}</div>;
}
