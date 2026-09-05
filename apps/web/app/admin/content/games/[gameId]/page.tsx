'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ExternalLink, Eye, EyeOff, RotateCcw, Save } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminContentGame, GameLifecycleStatus, GameOperationalStatus } from '@zenx-go/api-client';
import { useAdminContentGame } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/image-upload-field';
import { toast } from 'sonner';

const lifecycleOptions: Array<{ value: GameLifecycleStatus; label: string }> = [
  { value: 'LIVE', label: 'Đang vận hành' },
  { value: 'OPEN_BETA', label: 'Open Beta' },
  { value: 'CLOSED_BETA', label: 'Closed Beta' },
  { value: 'INTERNAL_TEST', label: 'Test nội bộ' },
  { value: 'IN_DEVELOPMENT', label: 'Đang phát triển' },
  { value: 'COMING_SOON', label: 'Sắp ra mắt' },
  { value: 'CONCEPT', label: 'Ý tưởng' },
  { value: 'SUNSET', label: 'Đã đóng' },
];

const operationalOptions: Array<{ value: GameOperationalStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Sẵn sàng phục vụ' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'DEGRADED', label: 'Hiệu năng suy giảm' },
  { value: 'UNAVAILABLE', label: 'Không khả dụng' },
];

type GameForm = {
  code: string;
  slug: string;
  subdomain: string;
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
};

export default function AdminContentGameDetailPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = typeof params.gameId === 'string' ? decodeURIComponent(params.gameId) : '';
  const gameQuery = useAdminContentGame(gameId);
  const game = gameQuery.data;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<GameForm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (game) setForm(toForm(game));
  }, [game]);

  const update = useMutation({
    mutationFn: () => api.admin.content.updateGame(gameId, {
      expectedUpdatedAt: game!.updatedAt,
      code: form!.code,
      slug: form!.slug,
      subdomain: form!.subdomain,
      name: form!.name,
      tagline: form!.tagline,
      shortDescription: form!.shortDescription,
      longDescription: form!.longDescription || null,
      lifecycleStatus: form!.lifecycleStatus,
      operationalStatus: form!.operationalStatus,
      releaseYear: form!.releaseYear ? Number(form!.releaseYear) : null,
      logoUrl: form!.logoUrl || null,
      iconUrl: form!.iconUrl || null,
      coverUrl: form!.coverUrl || null,
      heroDesktopUrl: form!.heroDesktopUrl || null,
      heroMobileUrl: form!.heroMobileUrl || null,
      primaryCtaLabel: form!.primaryCtaLabel || null,
      primaryCtaPath: form!.primaryCtaPath || null,
      secondaryCtaLabel: form!.secondaryCtaLabel || null,
      secondaryCtaPath: form!.secondaryCtaPath || null,
      featured: form!.featured,
      isPublic: form!.isPublic,
      sortOrder: Number(form!.sortOrder) || 0,
    }),
    onSuccess: () => {
      setConfirmOpen(false);
      toast.success('Đã lưu thông tin game thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'games'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (gameQuery.isLoading) return <GameDetailSkeleton />;
  if (gameQuery.isError || !game || !form) {
    return <div className="space-y-4"><Link href="/admin/content/games" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại danh sách game</Link><Alert>{getErrorMessage(gameQuery.error, 'Không thể tải thông tin game.')}</Alert></div>;
  }

  const originalForm = toForm(game);
  const changed = JSON.stringify(form) !== JSON.stringify(originalForm);
  const identityChanged = form.code !== game.code || form.slug !== game.slug || form.subdomain !== game.subdomain;
  const set = <K extends keyof GameForm>(field: K, value: GameForm[K]) => setForm((current) => current ? { ...current, [field]: value } : current);
  const submit = () => identityChanged ? setConfirmOpen(true) : update.mutate();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/content/games" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại Catalog Game</Link>
        {game.isPublic ? <Button asChild variant="outline" size="sm"><Link href={`/preview/games/${encodeURIComponent(game.slug)}`} target="_blank"><ExternalLink className="size-4" /> Xem preview</Link></Button> : null}
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative min-h-44 bg-slate-950 p-6 text-white sm:p-8">
          {game.coverUrl ? <img src={game.coverUrl} alt="" className="absolute inset-0 size-full object-cover opacity-35" /> : null}
          <div className="relative flex items-start gap-4">
            {game.iconUrl ? <img src={game.iconUrl} alt="" className="size-16 rounded-2xl border border-white/20 object-cover" /> : null}
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black sm:text-3xl">{game.name}</h1><span className="rounded-md bg-white/15 px-2 py-1 text-xs font-bold">{game.code}</span></div><p className="mt-2 max-w-2xl text-sm text-white/75">{game.tagline}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white/10 px-3 py-1">{game.lifecycleStatus}</span><span className="rounded-full bg-white/10 px-3 py-1">{game.operationalStatus}</span><span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1">{game.isPublic ? <Eye className="size-3" /> : <EyeOff className="size-3" />}{game.isPublic ? 'Public' : 'Private'}</span></div></div>
          </div>
        </div>
      </section>

      <form className="grid gap-6 lg:grid-cols-12" onSubmit={(event) => { event.preventDefault(); if (changed) submit(); }}>
        <div className="space-y-6 lg:col-span-8">
          <Section title="Định danh & đường dẫn" description="Code, slug và subdomain được phép chỉnh sửa; URL cũ sẽ ngừng hoạt động sau khi đổi.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Code" hint="Chữ hoa, số, _ hoặc -"><Input value={form.code} onChange={(event) => set('code', event.target.value.toUpperCase())} required /></Field>
              <Field label="Slug" hint="Được chuẩn hóa dạng kebab-case"><Input value={form.slug} onChange={(event) => set('slug', event.target.value)} required /></Field>
              <Field label="Subdomain" hint="Ví dụ: lucdia"><Input value={form.subdomain} onChange={(event) => set('subdomain', event.target.value.toLowerCase())} required /></Field>
            </div>
          </Section>

          <Section title="Nội dung cơ bản" description="Tên, khẩu hiệu và phần giới thiệu hiển thị trên portal.">
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Tên game"><Input value={form.name} onChange={(event) => set('name', event.target.value)} required /></Field><Field label="Tagline"><Input value={form.tagline} onChange={(event) => set('tagline', event.target.value)} /></Field></div>
            <Field label="Mô tả ngắn"><Textarea value={form.shortDescription} onChange={(event) => set('shortDescription', event.target.value)} className="min-h-20" /></Field>
            <Field label="Mô tả chi tiết"><Textarea value={form.longDescription} onChange={(event) => set('longDescription', event.target.value)} className="min-h-32" /></Field>
          </Section>

          <Section title="Hình ảnh" description="Các asset hiển thị trong catalog và trang game.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploadField label="Logo game" value={form.logoUrl} onChange={(value) => set('logoUrl', value)} aspectRatio="free" />
              <ImageUploadField label="Icon đại diện" value={form.iconUrl} onChange={(value) => set('iconUrl', value)} aspectRatio="1:1" />
              <ImageUploadField label="Ảnh bìa" value={form.coverUrl} onChange={(value) => set('coverUrl', value)} aspectRatio="16:9" />
              <ImageUploadField label="Hero desktop" value={form.heroDesktopUrl} onChange={(value) => set('heroDesktopUrl', value)} aspectRatio="16:9" />
              <div className="sm:col-span-2"><ImageUploadField label="Hero mobile" value={form.heroMobileUrl} onChange={(value) => set('heroMobileUrl', value)} aspectRatio="9:16" /></div>
            </div>
          </Section>

          <Section title="CTA" description="Nhãn và đường dẫn cho hai nút hành động.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nhãn CTA chính"><Input value={form.primaryCtaLabel} onChange={(event) => set('primaryCtaLabel', event.target.value)} /></Field>
              <Field label="Đường dẫn CTA chính"><Input value={form.primaryCtaPath} onChange={(event) => set('primaryCtaPath', event.target.value)} /></Field>
              <Field label="Nhãn CTA phụ"><Input value={form.secondaryCtaLabel} onChange={(event) => set('secondaryCtaLabel', event.target.value)} /></Field>
              <Field label="Đường dẫn CTA phụ"><Input value={form.secondaryCtaPath} onChange={(event) => set('secondaryCtaPath', event.target.value)} /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Section title="Vận hành" description="Các trạng thái cơ bản được phép cập nhật.">
            <Field label="Vòng đời"><Select value={form.lifecycleStatus} onChange={(event) => set('lifecycleStatus', event.target.value as GameLifecycleStatus)}>{lifecycleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field>
            <Field label="Trạng thái vận hành"><Select value={form.operationalStatus} onChange={(event) => set('operationalStatus', event.target.value as GameOperationalStatus)}>{operationalOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Năm phát hành"><Input type="number" value={form.releaseYear} onChange={(event) => set('releaseYear', event.target.value)} /></Field><Field label="Thứ tự"><Input type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} /></Field></div>
            <Toggle label="Hiển thị công khai" checked={form.isPublic} onChange={(value) => set('isPublic', value)} />
            <Toggle label="Game nổi bật" checked={form.featured} onChange={(value) => set('featured', value)} />
          </Section>

          <ReadonlySection title="Cấu hình nâng cao">
            <ReadonlyRow label="Loại bản ghi" value={game.recordType} />
            <ReadonlyRow label="Theme preset" value={game.themePreset} />
            <ReadonlyRow label="Primary game" value={game.primaryGame ? 'Có' : 'Không'} />
            <ReadonlyRow label="Thể loại" value={game.genres.map((genre) => genre.name).join(', ') || 'Chưa gán'} />
            <ReadonlyRow label="Nền tảng" value={game.platforms.join(', ') || 'Chưa gán'} />
            <details className="rounded-xl border border-slate-200 bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-bold text-slate-700">Xem theme/feature config</summary><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[11px] text-slate-600">{formatJson(game.themeConfig)}</pre><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-all border-t border-slate-200 pt-3 text-[11px] text-slate-600">{formatJson(game.featureConfig)}</pre></details>
          </ReadonlySection>

          <ReadonlySection title="Metadata"><ReadonlyRow label="Game ID" value={game.id} /><ReadonlyRow label="Tạo lúc" value={game.createdAt} /><ReadonlyRow label="Cập nhật" value={game.updatedAt} /></ReadonlySection>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3"><Button type="submit" disabled={!changed || update.isPending} className="bg-[#00873E] text-white hover:bg-[#007234]"><Save className="size-4" /> {update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</Button><Button type="button" variant="outline" disabled={!changed || update.isPending} onClick={() => setForm(originalForm)}><RotateCcw className="size-4" /> Hoàn tác</Button></div>
          </section>
        </div>
      </form>

      {confirmOpen ? <ConfirmDialog pending={update.isPending} onCancel={() => setConfirmOpen(false)} onConfirm={() => update.mutate()} /> : null}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="border-b border-slate-100 pb-3"><h2 className="font-black text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div>{children}</section>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs font-bold text-slate-700">{label}</span>{children}{hint ? <span className="block text-[11px] text-slate-500">{hint}</span> : null}</label>;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]" />{label}</label>;
}

function ReadonlySection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"><h2 className="font-black text-slate-900">{title}</h2><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chỉ đọc</span></div><div className="space-y-2.5">{children}</div></section>;
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs"><p className="font-semibold text-slate-500">{label}</p><p className="mt-1 break-all font-medium text-slate-800">{value}</p></div>;
}

function ConfirmDialog({ pending, onCancel, onConfirm }: { pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="identity-confirm-title"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><AlertTriangle className="size-5" /></span><div><h2 id="identity-confirm-title" className="text-lg font-black text-slate-900">Xác nhận đổi định danh</h2><p className="mt-2 text-sm leading-6 text-slate-600">Code, slug hoặc subdomain đang thay đổi. URL cũ sẽ không được redirect.</p></div></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onCancel}>Hủy</Button><Button type="button" disabled={pending} onClick={onConfirm} className="bg-amber-600 text-white hover:bg-amber-700">{pending ? 'Đang lưu…' : 'Xác nhận lưu'}</Button></div></div></div>;
}

function toForm(game: AdminContentGame): GameForm {
  return {
    code: game.code, slug: game.slug, subdomain: game.subdomain, name: game.name, tagline: game.tagline,
    shortDescription: game.shortDescription, longDescription: game.longDescription ?? '',
    lifecycleStatus: game.lifecycleStatus, operationalStatus: game.operationalStatus,
    releaseYear: game.releaseYear ? String(game.releaseYear) : '', logoUrl: game.logoUrl ?? '', iconUrl: game.iconUrl ?? '',
    coverUrl: game.coverUrl ?? '', heroDesktopUrl: game.heroDesktopUrl ?? '', heroMobileUrl: game.heroMobileUrl ?? '',
    primaryCtaLabel: game.primaryCtaLabel ?? '', primaryCtaPath: game.primaryCtaPath ?? '',
    secondaryCtaLabel: game.secondaryCtaLabel ?? '', secondaryCtaPath: game.secondaryCtaPath ?? '',
    featured: game.featured, isPublic: game.isPublic, sortOrder: String(game.sortOrder),
  };
}

function formatJson(value: string) { try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } }
function GameDetailSkeleton() { return <div className="space-y-6"><Skeleton className="h-8 w-56" /><Skeleton className="h-44 rounded-3xl" /><div className="grid gap-6 lg:grid-cols-12"><Skeleton className="h-[600px] rounded-3xl lg:col-span-8" /><Skeleton className="h-[600px] rounded-3xl lg:col-span-4" /></div></div>; }
