'use client';

import { Edit3, Megaphone, Plus, Save, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminContentAnnouncement, ContentPublishStatus } from '@zenx-go/api-client';
import { useAdminContentAnnouncements } from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type Form = { code: string; title: string; message: string; ctaLabel: string; ctaPath: string; status: ContentPublishStatus; startsAt: string; endsAt: string; sortOrder: string; reason: string };

export default function AdminContentAnnouncementsPage() {
  const queryClient = useQueryClient();
  const query = useAdminContentAnnouncements({});
  const [editing, setEditing] = useState<AdminContentAnnouncement | null | undefined>(undefined);
  const create = useMutation({
    mutationFn: (form: Form) => api.admin.content.createAnnouncement(toCreate(form)),
    onSuccess: () => { toast.success('Đã tạo thông báo.'); setEditing(undefined); invalidate(queryClient); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const update = useMutation({
    mutationFn: ({ item, form }: { item: AdminContentAnnouncement; form: Form }) => api.admin.content.updateAnnouncement(item.id, toUpdate(item, form)),
    onSuccess: () => { toast.success('Đã lưu thông báo.'); setEditing(undefined); invalidate(queryClient); },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-[#00873E]">Content CMS</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">Thông báo portal</h2><p className="mt-1 text-sm text-slate-500">Quản lý ribbon thông báo hiển thị trên trang chủ.</p></div><Button size="sm" onClick={() => setEditing(null)}><Plus className="size-4" /> Tạo thông báo</Button></div>
      {query.isLoading ? <Skeleton className="h-[500px] rounded-2xl" /> : query.isError || !query.data ? <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">Không thể tải danh sách thông báo.</div> : <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">{query.data.items.length ? <div className="divide-y divide-slate-100">{query.data.items.map((item) => <div key={item.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Megaphone className="size-4" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold text-[#00873E]">{item.code}</span><StatusBadge status={item.status} /></div><p className="mt-1 font-bold text-slate-800">{item.title}</p><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-[11px] text-slate-400">{formatDate(item.startsAt)}{item.endsAt ? ` → ${formatDate(item.endsAt)}` : ''} · Thứ tự {item.sortOrder}</p></div></div><Button variant="ghost" size="icon" onClick={() => setEditing(item)} aria-label="Sửa thông báo"><Edit3 className="size-4" /></Button></div>)}</div> : <div className="p-12 text-center text-sm text-slate-500">Chưa có thông báo.</div>}</section>}
      {editing !== undefined ? <AnnouncementDialog item={editing} pending={create.isPending || update.isPending} onClose={() => setEditing(undefined)} onSubmit={(form) => editing ? update.mutate({ item: editing, form }) : create.mutate(form)} /> : null}
    </div>
  );
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'announcements'] });
  void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
}
function toInput(value?: string | null) { if (!value) return ''; const date = new Date(value); const pad = (part: number) => String(part).padStart(2, '0'); return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`; }
function toApi(value: string) { return new Date(value).toISOString(); }
function toForm(item: AdminContentAnnouncement | null): Form { return item ? { code: item.code, title: item.title, message: item.message, ctaLabel: item.ctaLabel ?? '', ctaPath: item.ctaPath ?? '', status: item.status, startsAt: toInput(item.startsAt), endsAt: toInput(item.endsAt), sortOrder: String(item.sortOrder), reason: '' } : { code: '', title: '', message: '', ctaLabel: '', ctaPath: '', status: 'DRAFT', startsAt: '', endsAt: '', sortOrder: '0', reason: '' }; }
function toCreate(form: Form) { return { code: form.code, title: form.title, message: form.message, ctaLabel: form.ctaLabel || null, ctaPath: form.ctaPath || null, status: form.status, startsAt: toApi(form.startsAt), endsAt: form.endsAt ? toApi(form.endsAt) : null, sortOrder: Number(form.sortOrder) || 0, reason: form.reason }; }
function toUpdate(item: AdminContentAnnouncement, form: Form) { return { title: form.title, message: form.message, ctaLabel: form.ctaLabel || null, ctaPath: form.ctaPath || null, status: form.status, startsAt: toApi(form.startsAt), endsAt: form.endsAt ? toApi(form.endsAt) : null, sortOrder: Number(form.sortOrder) || 0, reason: form.reason, expectedUpdatedAt: item.updatedAt }; }
function StatusBadge({ status }: { status: ContentPublishStatus }) { return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{status === 'PUBLISHED' ? 'Đã publish' : 'Bản nháp'}</span>; }

function AnnouncementDialog({ item, pending, onClose, onSubmit }: { item: AdminContentAnnouncement | null; pending: boolean; onClose: () => void; onSubmit: (form: Form) => void }) {
  const [form, setForm] = useState(() => toForm(item));
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const canSubmit = form.title.trim().length >= 2 && form.message.trim().length > 0 && form.startsAt && form.reason.trim().length >= 5 && (item || form.code.trim().length >= 2);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-lg font-black text-slate-900">{item ? 'Sửa thông báo' : 'Tạo thông báo'}</h2><p className="mt-1 text-xs text-slate-500">Mọi thay đổi được ghi vào audit log.</p></div><button onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div><div className="mt-6 grid gap-5 md:grid-cols-2"><Field label="Code"><Input value={form.code} onChange={(event) => set('code', event.target.value)} disabled={Boolean(item)} /></Field><Field label="Trạng thái"><Select value={form.status} onChange={(event) => set('status', event.target.value as ContentPublishStatus)}><option value="DRAFT">Bản nháp</option><option value="PUBLISHED">Đã publish</option></Select></Field><Field label="Tiêu đề"><Input value={form.title} onChange={(event) => set('title', event.target.value)} /></Field><Field label="Thứ tự"><Input type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} /></Field><div className="md:col-span-2"><Field label="Thông điệp"><Textarea value={form.message} onChange={(event) => set('message', event.target.value)} className="min-h-24" /></Field></div><Field label="Bắt đầu"><Input type="datetime-local" value={form.startsAt} onChange={(event) => set('startsAt', event.target.value)} /></Field><Field label="Kết thúc (tuỳ chọn)"><Input type="datetime-local" value={form.endsAt} onChange={(event) => set('endsAt', event.target.value)} /></Field><Field label="CTA label"><Input value={form.ctaLabel} onChange={(event) => set('ctaLabel', event.target.value)} /></Field><Field label="CTA path"><Input value={form.ctaPath} onChange={(event) => set('ctaPath', event.target.value)} /></Field></div><div className="mt-5"><Field label="Lý do"><Textarea value={form.reason} onChange={(event) => set('reason', event.target.value)} placeholder="Nhập lý do, tối thiểu 5 ký tự…" /></Field></div><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Huỷ</Button><Button disabled={pending || !canSubmit} onClick={() => onSubmit(form)}><Save className="size-4" /> {pending ? 'Đang lưu…' : 'Lưu thay đổi'}</Button></div></div></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-xs font-bold text-slate-700">{label}</span>{children}</label>; }
