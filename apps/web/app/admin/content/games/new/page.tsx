'use client';

import Link from 'next/link';
import { ArrowLeft, Gamepad2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GameLifecycleStatus, GameOperationalStatus, GamePlatform, GameTemplatePreset } from '@zenx-go/api-client';
import { useAdminContentGameOptions, useAdminContentGameTemplates } from '@/hooks/use-content';
import { ImageUploadField } from '@/components/image-upload-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { toast } from 'sonner';

const lifecycleOptions: Array<{ value: GameLifecycleStatus; label: string }> = [
  { value: 'CONCEPT', label: 'Ý tưởng' },
  { value: 'IN_DEVELOPMENT', label: 'Đang phát triển' },
  { value: 'INTERNAL_TEST', label: 'Test nội bộ' },
  { value: 'CLOSED_BETA', label: 'Closed Beta' },
  { value: 'OPEN_BETA', label: 'Open Beta' },
  { value: 'COMING_SOON', label: 'Sắp ra mắt' },
  { value: 'LIVE', label: 'Đang vận hành' },
  { value: 'SUNSET', label: 'Đã đóng' },
];

const operationalOptions: Array<{ value: GameOperationalStatus; label: string }> = [
  { value: 'UNAVAILABLE', label: 'Chưa khả dụng' },
  { value: 'AVAILABLE', label: 'Sẵn sàng phục vụ' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì' },
  { value: 'DEGRADED', label: 'Hiệu năng suy giảm' },
];

type GameCreateForm = {
  themePreset: GameTemplatePreset;
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
  sortOrder: string;
  genreCodes: string[];
  platforms: GamePlatform[];
};

const initialForm: GameCreateForm = {
  themePreset: 'EDITORIAL_FANTASY',
  code: '', slug: '', subdomain: '', name: '', tagline: '', shortDescription: '', longDescription: '',
  lifecycleStatus: 'CONCEPT', operationalStatus: 'UNAVAILABLE', releaseYear: '', logoUrl: '', iconUrl: '',
  coverUrl: '', heroDesktopUrl: '', heroMobileUrl: '', primaryCtaLabel: '', primaryCtaPath: '',
  secondaryCtaLabel: '', secondaryCtaPath: '', featured: false, sortOrder: '0', genreCodes: [], platforms: [],
};

export default function AdminContentGameCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const optionsQuery = useAdminContentGameOptions();
  const templatesQuery = useAdminContentGameTemplates();
  const [form, setForm] = useState(initialForm);
  const [identityTouched, setIdentityTouched] = useState(false);
  const set = <K extends keyof GameCreateForm>(field: K, value: GameCreateForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const create = useMutation({
    mutationFn: () => api.admin.content.createGame({
      themePreset: form.themePreset,
      code: form.code,
      slug: form.slug,
      subdomain: form.subdomain,
      name: form.name,
      tagline: form.tagline,
      shortDescription: form.shortDescription,
      longDescription: form.longDescription || null,
      lifecycleStatus: form.lifecycleStatus,
      operationalStatus: form.operationalStatus,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
      logoUrl: form.logoUrl || null,
      iconUrl: form.iconUrl || null,
      coverUrl: form.coverUrl || null,
      heroDesktopUrl: form.heroDesktopUrl || null,
      heroMobileUrl: form.heroMobileUrl || null,
      primaryCtaLabel: form.primaryCtaLabel || null,
      primaryCtaPath: form.primaryCtaPath || null,
      secondaryCtaLabel: form.secondaryCtaLabel || null,
      secondaryCtaPath: form.secondaryCtaPath || null,
      featured: form.featured,
      sortOrder: Number(form.sortOrder) || 0,
      genreCodes: form.genreCodes,
      platforms: form.platforms,
    }),
    onSuccess: (game) => {
      toast.success('Đã tạo game mới thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'games'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
      router.replace(`/admin/content/games/${game.id}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const onNameChange = (name: string) => {
    setForm((current) => {
      if (identityTouched) return { ...current, name };
      const slug = toSlug(name);
      return { ...current, name, slug, subdomain: slug.slice(0, 63).replace(/-+$/g, '') };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content/games"
            className="inline-flex items-center justify-center size-8 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Thêm game mới</h1>
            <p className="text-xs text-slate-500">Game được tạo ở trạng thái ẩn mặc định. Bạn có thể hoàn thiện nội dung rồi mới công khai.</p>
          </div>
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-12" onSubmit={(event) => { event.preventDefault(); create.mutate(); }}>
        <div className="space-y-6 lg:col-span-8">
          <Section title="Chọn giao diện mẫu" description="Template quyết định bố cục và phong cách hiển thị. Có thể chỉnh nội dung, màu và asset sau khi tạo; không thể đổi template.">
            <div className="grid gap-3 sm:grid-cols-2">{(templatesQuery.data ?? []).map((template) => <button key={template.id} type="button" onClick={() => set('themePreset', template.id)} className={`overflow-hidden rounded-2xl border text-left transition ${form.themePreset === template.id ? 'border-[#00873E] ring-2 ring-[#00873E]/20' : 'border-slate-200 hover:border-slate-300'}`}><img src={template.thumbnailUrl} alt="" className="h-28 w-full object-cover" /><div className="p-3"><p className="font-black text-slate-900">{template.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{template.description}</p></div></button>)}</div>
            {templatesQuery.isLoading ? <p className="text-xs text-slate-500">Đang tải danh sách giao diện…</p> : null}
            {templatesQuery.isError ? <p className="text-xs font-semibold text-red-600">Không thể tải danh sách giao diện mẫu.</p> : null}
          </Section>
          <Section title="Định danh & đường dẫn" description="Các giá trị này phải duy nhất trên toàn hệ thống.">
            <Field label="Tên game"><Input value={form.name} onChange={(event) => onNameChange(event.target.value)} required minLength={2} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Code" hint="Chữ hoa, số, _ hoặc -"><Input value={form.code} onChange={(event) => set('code', event.target.value.toUpperCase())} required minLength={2} /></Field>
              <Field label="Slug" hint="Dùng trong URL game"><Input value={form.slug} onChange={(event) => { setIdentityTouched(true); set('slug', event.target.value); }} required /></Field>
              <Field label="Subdomain"><Input value={form.subdomain} onChange={(event) => { setIdentityTouched(true); set('subdomain', event.target.value.toLowerCase()); }} required /></Field>
            </div>
          </Section>

          <Section title="Nội dung cơ bản" description="Thông tin hiển thị trên catalog và trang giới thiệu game.">
            <Field label="Tagline"><Input value={form.tagline} onChange={(event) => set('tagline', event.target.value)} /></Field>
            <Field label="Mô tả ngắn"><Textarea value={form.shortDescription} onChange={(event) => set('shortDescription', event.target.value)} className="min-h-20" /></Field>
            <Field label="Mô tả chi tiết"><Textarea value={form.longDescription} onChange={(event) => set('longDescription', event.target.value)} className="min-h-32" /></Field>
          </Section>

          <Section title="Hình ảnh" description="Có thể bỏ qua và bổ sung sau trong màn hình chỉnh sửa.">
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploadField label="Logo game" value={form.logoUrl} onChange={(value) => set('logoUrl', value)} aspectRatio="free" />
              <ImageUploadField label="Icon đại diện" value={form.iconUrl} onChange={(value) => set('iconUrl', value)} aspectRatio="1:1" />
              <ImageUploadField label="Ảnh bìa" value={form.coverUrl} onChange={(value) => set('coverUrl', value)} aspectRatio="16:9" />
              <ImageUploadField label="Hero desktop" value={form.heroDesktopUrl} onChange={(value) => set('heroDesktopUrl', value)} aspectRatio="16:9" />
              <div className="sm:col-span-2"><ImageUploadField label="Hero mobile" value={form.heroMobileUrl} onChange={(value) => set('heroMobileUrl', value)} aspectRatio="9:16" /></div>
            </div>
          </Section>

          <Section title="CTA" description="Nhãn và đường dẫn cho các nút hành động.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nhãn CTA chính"><Input value={form.primaryCtaLabel} onChange={(event) => set('primaryCtaLabel', event.target.value)} /></Field>
              <Field label="Đường dẫn CTA chính"><Input value={form.primaryCtaPath} onChange={(event) => set('primaryCtaPath', event.target.value)} /></Field>
              <Field label="Nhãn CTA phụ"><Input value={form.secondaryCtaLabel} onChange={(event) => set('secondaryCtaLabel', event.target.value)} /></Field>
              <Field label="Đường dẫn CTA phụ"><Input value={form.secondaryCtaPath} onChange={(event) => set('secondaryCtaPath', event.target.value)} /></Field>
            </div>
          </Section>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Section title="Vận hành" description="Thiết lập trạng thái ban đầu cho game.">
            <Field label="Vòng đời"><Select value={form.lifecycleStatus} onChange={(event) => set('lifecycleStatus', event.target.value as GameLifecycleStatus)}>{lifecycleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
            <Field label="Trạng thái vận hành"><Select value={form.operationalStatus} onChange={(event) => set('operationalStatus', event.target.value as GameOperationalStatus)}>{operationalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Năm phát hành"><Input type="number" min={1900} max={2100} value={form.releaseYear} onChange={(event) => set('releaseYear', event.target.value)} /></Field><Field label="Thứ tự"><Input type="number" value={form.sortOrder} onChange={(event) => set('sortOrder', event.target.value)} /></Field></div>
            <Toggle label="Game nổi bật" checked={form.featured} onChange={(value) => set('featured', value)} />
          </Section>

          <Section title="Phân loại" description="Chọn ít nhất một thể loại và một nền tảng.">
            <div><p className="mb-2 text-xs font-bold text-slate-700">Thể loại</p><div className="grid gap-2">{(optionsQuery.data?.genres ?? []).map((genre) => <Choice key={genre.code} label={genre.name} checked={form.genreCodes.includes(genre.code)} onChange={(checked) => set('genreCodes', checked ? [...form.genreCodes, genre.code] : form.genreCodes.filter((code) => code !== genre.code))} />)}</div></div>
            <div><p className="mb-2 text-xs font-bold text-slate-700">Nền tảng</p><div className="grid gap-2">{(optionsQuery.data?.platforms ?? []).map((platform) => <Choice key={platform.code} label={platform.label} checked={form.platforms.includes(platform.code)} onChange={(checked) => set('platforms', checked ? [...form.platforms, platform.code] : form.platforms.filter((code) => code !== platform.code))} />)}</div></div>
            {optionsQuery.isError ? <p className="text-xs font-semibold text-red-600">Không thể tải danh sách phân loại.</p> : null}
          </Section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-xs leading-5 text-slate-500">Cấu hình theme và tính năng nâng cao sẽ dùng giá trị mặc định; có thể mở rộng sau khi game được tạo.</p>
            <Button type="submit" disabled={create.isPending || templatesQuery.isLoading || templatesQuery.isError || !form.name || !form.code || !form.slug || !form.subdomain || form.genreCodes.length === 0 || form.platforms.length === 0} className="w-full bg-[#00873E] text-white hover:bg-[#007234]"><Save className="size-4" /> {create.isPending ? 'Đang tạo…' : 'Tạo game'}</Button>
          </section>
        </div>
      </form>
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

function Choice({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]" />{label}</label>;
}

function toSlug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
}
