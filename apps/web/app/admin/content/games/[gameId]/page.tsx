'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminContentGame, GameLifecycleStatus, GameOperationalStatus } from '@zenx-go/api-client';
import { useAdminContentGame } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { toast } from 'sonner';

const lifecycleOptions: Array<{ value: GameLifecycleStatus; label: string }> = [
  { value: 'CONCEPT', label: 'Ý tưởng' },
  { value: 'IN_DEVELOPMENT', label: 'Đang phát triển' },
  { value: 'INTERNAL_TEST', label: 'Test nội bộ' },
  { value: 'CLOSED_BETA', label: 'Closed beta' },
  { value: 'OPEN_BETA', label: 'Open beta' },
  { value: 'LIVE', label: 'Đang vận hành' },
  { value: 'COMING_SOON', label: 'Sắp ra mắt' },
  { value: 'SUNSET', label: 'Đã đóng' },
];
const operationalOptions: Array<{ value: GameOperationalStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'MAINTENANCE', label: 'Bảo trì' },
  { value: 'DEGRADED', label: 'Suy giảm' },
  { value: 'UNAVAILABLE', label: 'Không khả dụng' },
];

type GameForm = {
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  lifecycleStatus: GameLifecycleStatus;
  operationalStatus: GameOperationalStatus;
  releaseYear: string;
  logoUrl: string;
  iconUrl: string;
  coverUrl: string;
  heroDesktopUrl: string;
  heroMobileUrl: string;
  primaryCtaLabel: string;
  primaryCtaPath: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
  featured: boolean;
  isPublic: boolean;
  sortOrder: string;
  reason: string;
};

export default function AdminContentGameDetailPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = typeof params.gameId === 'string' ? decodeURIComponent(params.gameId) : '';
  const gameQuery = useAdminContentGame(gameId);
  const game = gameQuery.data;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GameForm | null>(null);

  useEffect(() => {
    if (!game) return;
    setForm(toForm(game));
  }, [game]);

  const update = useMutation({
    mutationFn: () =>
      api.admin.content.updateGame(gameId, {
        ...form!,
        releaseYear: form!.releaseYear ? Number(form!.releaseYear) : null,
        sortOrder: Number(form!.sortOrder) || 0,
        expectedUpdatedAt: game!.updatedAt,
      }),
    onSuccess: () => {
      toast.success('Đã lưu thông tin game.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'games'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (gameQuery.isLoading) return <Skeleton className="h-[900px] rounded-2xl" />;
  if (gameQuery.isError || !game || !form) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Alert>{getErrorMessage(gameQuery.error, 'Không thể tải game.')}</Alert>
      </div>
    );
  }
  const set = <K extends keyof GameForm>(key: K, value: GameForm[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));
  return (
    <div className="space-y-6">
      <BackLink />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[#00873E]">Content CMS / Game</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{game.name}</h2>
          <p className="mt-1 text-sm text-slate-500">Chỉnh sửa nội dung cơ bản và khả năng hiển thị.</p>
        </div>
        {game.isPublic ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/preview/games/${encodeURIComponent(game.slug)}`} target="_blank">
              <ExternalLink className="size-4" /> Mở preview
            </Link>
          </Button>
        ) : null}
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <h3 className="font-black text-slate-900">Thông tin định danh (chỉ đọc)</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <ReadOnly label="Code" value={game.code} />
          <ReadOnly label="Slug" value={game.slug} />
          <ReadOnly label="Subdomain" value={game.subdomain} />
          <ReadOnly label="Theme preset" value={game.themePreset} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">Genre: {game.genres.map((item) => item.name).join(', ') || '—'}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Platform: {game.platforms.join(', ') || '—'}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">Primary game: {game.primaryGame ? 'Có' : 'Không'}</span>
        </div>
      </section>
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.reason.trim().length < 5) return;
          update.mutate();
        }}
      >
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="font-black text-slate-900">Nội dung hiển thị</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field label="Tên game"><Input value={form.name} onChange={(event) => set('name', event.target.value)} /></Field>
            <Field label="Tagline"><Input value={form.tagline} onChange={(event) => set('tagline', event.target.value)} /></Field>
            <Field label="Mô tả ngắn"><Textarea value={form.shortDescription} onChange={(event) => set('shortDescription', event.target.value)} className="min-h-24" /></Field>
            <Field label="Mô tả dài"><Textarea value={form.longDescription} onChange={(event) => set('longDescription', event.target.value)} className="min-h-24" /></Field>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="font-black text-slate-900">Trạng thái và CTA</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Vòng đời"><Select value={form.lifecycleStatus} onChange={(event) => set('lifecycleStatus', event.target.value as GameLifecycleStatus)}>{lifecycleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field>
            <Field label="Trạng thái vận hành"><Select value={form.operationalStatus} onChange={(event) => set('operationalStatus', event.target.value as GameOperationalStatus)}>{operationalOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field>
            <Field label="Năm phát hành"><Input type="number" value={form.releaseYear} onChange={(event) => set('releaseYear', event.target.value)} /></Field>
            <Field label="Thứ tự"><Input type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} /></Field>
            <Field label="CTA chính"><Input value={form.primaryCtaLabel} onChange={(event) => set('primaryCtaLabel', event.target.value)} /></Field>
            <Field label="Đường dẫn CTA chính"><Input value={form.primaryCtaPath} onChange={(event) => set('primaryCtaPath', event.target.value)} /></Field>
            <Field label="CTA phụ"><Input value={form.secondaryCtaLabel} onChange={(event) => set('secondaryCtaLabel', event.target.value)} /></Field>
            <Field label="Đường dẫn CTA phụ"><Input value={form.secondaryCtaPath} onChange={(event) => set('secondaryCtaPath', event.target.value)} /></Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold text-slate-700">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(event) => set('featured', event.target.checked)} className="size-4 rounded border-slate-300 text-[#00873E]" /> Featured</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.isPublic} onChange={(event) => set('isPublic', event.target.checked)} className="size-4 rounded border-slate-300 text-[#00873E]" /> Hiển thị public</label>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <h3 className="font-black text-slate-900">Asset URL</h3>
          <p className="mt-1 text-xs text-slate-500">Chỉ nhận đường dẫn nội bộ /images, /uploads hoặc http/https.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field label="Logo"><Input value={form.logoUrl} onChange={(event) => set('logoUrl', event.target.value)} /></Field>
            <Field label="Icon"><Input value={form.iconUrl} onChange={(event) => set('iconUrl', event.target.value)} /></Field>
            <Field label="Cover"><Input value={form.coverUrl} onChange={(event) => set('coverUrl', event.target.value)} /></Field>
            <Field label="Hero desktop"><Input value={form.heroDesktopUrl} onChange={(event) => set('heroDesktopUrl', event.target.value)} /></Field>
            <Field label="Hero mobile"><Input value={form.heroMobileUrl} onChange={(event) => set('heroMobileUrl', event.target.value)} /></Field>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <Field label="Lý do thay đổi"><Textarea value={form.reason} onChange={(event) => set('reason', event.target.value)} placeholder="Nhập lý do, tối thiểu 5 ký tự…" /></Field>
          <div className="mt-5 flex justify-end"><Button type="submit" disabled={update.isPending || form.reason.trim().length < 5}><Save className="size-4" /> {update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div>
        </section>
      </form>
    </div>
  );
}

function toForm(game: AdminContentGame): GameForm {
  return {
    name: game.name,
    tagline: game.tagline,
    shortDescription: game.shortDescription,
    longDescription: game.longDescription ?? '',
    lifecycleStatus: game.lifecycleStatus,
    operationalStatus: game.operationalStatus,
    releaseYear: game.releaseYear ? String(game.releaseYear) : '',
    logoUrl: game.logoUrl ?? '',
    iconUrl: game.iconUrl ?? '',
    coverUrl: game.coverUrl ?? '',
    heroDesktopUrl: game.heroDesktopUrl ?? '',
    heroMobileUrl: game.heroMobileUrl ?? '',
    primaryCtaLabel: game.primaryCtaLabel ?? '',
    primaryCtaPath: game.primaryCtaPath ?? '',
    secondaryCtaLabel: game.secondaryCtaLabel ?? '',
    secondaryCtaPath: game.secondaryCtaPath ?? '',
    featured: game.featured,
    isPublic: game.isPublic,
    sortOrder: String(game.sortOrder),
    reason: '',
  };
}

function BackLink() {
  return <Link href="/admin/content/games" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại danh sách game</Link>;
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-700">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-xs font-bold text-slate-700">{label}</span>{children}</label>;
}
