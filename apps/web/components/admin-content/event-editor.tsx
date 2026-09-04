'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminContentEvent, ContentPublishStatus } from '@zenx-go/api-client';
import { useAdminContentEvent, useAdminContentGames } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { SupportMarkdown } from '@/components/support-markdown';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type EventForm = {
  gameId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  startsAt: string;
  endsAt: string;
  seoTitle: string;
  seoDescription: string;
  status: ContentPublishStatus;
  reason: string;
};

export function EventEditor({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const editing = Boolean(eventId);
  const eventQuery = useAdminContentEvent(eventId ?? '', editing);
  const games = useAdminContentGames({ page: 1, pageSize: 50 });
  const event = eventQuery.data;
  const [form, setForm] = useState<EventForm>(() => defaultForm());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (event && !initialized) {
      setForm(toForm(event));
      setInitialized(true);
    }
  }, [event, initialized]);

  const create = useMutation({
    mutationFn: () => api.admin.content.createEvent(toRequest(form)),
    onSuccess: () => {
      toast.success('Đã tạo sự kiện.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'events'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
      router.push('/admin/content/events');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const update = useMutation({
    mutationFn: () => api.admin.content.updateEvent(eventId!, {
      gameId: form.gameId || null,
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      coverImageUrl: form.coverImageUrl || null,
      startsAt: toApiDate(form.startsAt),
      endsAt: form.endsAt ? toApiDate(form.endsAt) : null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      status: form.status,
      reason: form.reason,
      expectedUpdatedAt: event!.updatedAt,
    }),
    onSuccess: () => {
      toast.success('Đã lưu sự kiện.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'event', eventId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'events'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const pending = create.isPending || update.isPending;
  if (editing && eventQuery.isLoading) return <Skeleton className="h-[900px] rounded-2xl" />;
  if (editing && (eventQuery.isError || !event)) {
    return <div className="space-y-4"><BackLink /><Alert>{getErrorMessage(eventQuery.error, 'Không thể tải sự kiện.')}</Alert></div>;
  }
  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const canSubmit = form.title.trim().length >= 3 && form.slug.trim().length >= 3 && form.excerpt.trim().length >= 3 && form.content.trim().length > 0 && Boolean(form.startsAt) && form.reason.trim().length >= 5;
  return (
    <div className="space-y-6">
      <BackLink />
      <div><p className="text-sm font-semibold text-[#00873E]">Content CMS / Sự kiện</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{editing ? 'Sửa sự kiện' : 'Tạo sự kiện'}</h2><p className="mt-1 text-sm text-slate-500">Sự kiện có thể dành cho một game hoặc toàn portal.</p></div>
      <form className="space-y-6" onSubmit={(submitEvent) => { submitEvent.preventDefault(); if (!canSubmit) return; if (editing) update.mutate(); else create.mutate(); }}>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Phạm vi game"><Select value={form.gameId} onChange={(input) => set('gameId', input.target.value)}><option value="">Toàn portal</option>{(games.data?.items ?? []).map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</Select></Field>
            <Field label="Trạng thái"><Select value={form.status} onChange={(input) => set('status', input.target.value as ContentPublishStatus)}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Publish ngay</option></Select></Field>
            <Field label="Tiêu đề"><Input value={form.title} onChange={(input) => set('title', input.target.value)} maxLength={240} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={(input) => set('slug', input.target.value)} disabled={editing} placeholder="su-kien-mua-he" maxLength={180} /></Field>
            <Field label="Bắt đầu"><Input type="datetime-local" value={form.startsAt} onChange={(input) => set('startsAt', input.target.value)} /></Field>
            <Field label="Kết thúc (tuỳ chọn)"><Input type="datetime-local" value={form.endsAt} onChange={(input) => set('endsAt', input.target.value)} /></Field>
            <Field label="Cover URL"><Input value={form.coverImageUrl} onChange={(input) => set('coverImageUrl', input.target.value)} placeholder="/images/... hoặc https://..." /></Field>
            <div className="md:col-span-2"><Field label="Excerpt"><Textarea value={form.excerpt} onChange={(input) => set('excerpt', input.target.value)} className="min-h-24" maxLength={1000} /></Field></div>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2"><Eye className="size-4 text-[#00873E]" /><h3 className="font-black text-slate-900">Nội dung Markdown</h3></div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2"><Textarea aria-label="Nội dung Markdown" value={form.content} onChange={(input) => set('content', input.target.value)} className="min-h-[420px] font-mono text-sm" placeholder="# Sự kiện\n\nNội dung…" maxLength={50000} /><div className="min-h-[420px] rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Preview</p><SupportMarkdown>{form.content || 'Chưa có nội dung.'}</SupportMarkdown></div></div>
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"><h3 className="font-black text-slate-900">SEO (tuỳ chọn)</h3><div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="SEO title"><Input value={form.seoTitle} onChange={(input) => set('seoTitle', input.target.value)} maxLength={240} /></Field><Field label="SEO description"><Textarea value={form.seoDescription} onChange={(input) => set('seoDescription', input.target.value)} className="min-h-24" maxLength={500} /></Field></div></section>
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7"><Field label="Lý do thay đổi"><Textarea value={form.reason} onChange={(input) => set('reason', input.target.value)} placeholder="Nhập lý do, tối thiểu 5 ký tự…" /></Field><div className="mt-5 flex justify-end"><Button type="submit" disabled={pending || !canSubmit}><Save className="size-4" /> {pending ? 'Đang lưu…' : editing ? 'Lưu sự kiện' : 'Tạo sự kiện'}</Button></div></section>
      </form>
    </div>
  );
}

function defaultForm(): EventForm { return { gameId: '', title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', startsAt: '', endsAt: '', seoTitle: '', seoDescription: '', status: 'DRAFT', reason: '' }; }
function toForm(event: AdminContentEvent): EventForm { return { gameId: event.gameId ?? '', title: event.title, slug: event.slug, excerpt: event.excerpt, content: event.content ?? '', coverImageUrl: event.coverImageUrl ?? '', startsAt: toInputDate(event.startsAt), endsAt: event.endsAt ? toInputDate(event.endsAt) : '', seoTitle: event.seoTitle ?? '', seoDescription: event.seoDescription ?? '', status: event.status, reason: '' }; }
function toRequest(form: EventForm) { return { gameId: form.gameId || null, title: form.title, slug: form.slug, excerpt: form.excerpt, content: form.content, coverImageUrl: form.coverImageUrl || null, startsAt: toApiDate(form.startsAt), endsAt: form.endsAt ? toApiDate(form.endsAt) : null, seoTitle: form.seoTitle || null, seoDescription: form.seoDescription || null, status: form.status, reason: form.reason }; }
function toInputDate(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; const pad = (part: number) => String(part).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function toApiDate(value: string) { return new Date(value).toISOString(); }
function BackLink() { return <Link href="/admin/content/events" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"><ArrowLeft className="size-4" /> Quay lại sự kiện</Link>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-xs font-bold text-slate-700">{label}</span>{children}</label>; }
