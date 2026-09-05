'use client';

import type { FeatureConfig, GamePageConfig, GamePageItem, GameTemplatePreset, ThemeConfig } from '@zenx-go/api-client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type PresentationValue = { themeConfig: ThemeConfig; featureConfig: FeatureConfig; pageConfig: GamePageConfig };

const sectionOptions = [
  ['HERO', 'Hero'], ['GAME_INTRODUCTION', 'Giới thiệu'], ['FEATURE_GRID', 'Điểm nổi bật'],
  ['PLATFORM_CARDS', 'Nền tảng'], ['MEDIA_GALLERY', 'Thư viện ảnh'], ['ROADMAP_PREVIEW', 'Roadmap'],
  ['ARTICLE_GRID', 'Tin tức'], ['COMMUNITY_CTA', 'Cộng đồng'],
] as const;
const routeOptions = [['ABOUT', 'Giới thiệu'], ['NEWS', 'Tin tức'], ['ROADMAP', 'Roadmap'], ['DOWNLOAD', 'Tải game']] as const;

export function GamePresentationEditor({ value, preset, onChange }: { value: PresentationValue; preset: GameTemplatePreset; onChange: (value: PresentationValue) => void }) {
  const setTheme = (key: keyof ThemeConfig, next: string) => onChange({ ...value, themeConfig: { ...value.themeConfig, [key]: next } });
  const setFeature = (key: 'sections' | 'routes', next: string[]) => onChange({ ...value, featureConfig: { ...value.featureConfig, [key]: next } });
  const setBlock = (key: 'hero' | 'intro' | 'closing', patch: Record<string, string | null>) => onChange({ ...value, pageConfig: { ...value.pageConfig, [key]: { ...value.pageConfig[key], ...patch } } });
  const setItems = (key: 'featureCards' | 'gallery' | 'roles' | 'locations' | 'equipment', items: GamePageItem[]) => onChange({ ...value, pageConfig: { ...value.pageConfig, [key]: items } });
  const sections = value.featureConfig.sections ?? [];
  const routes = value.featureConfig.routes ?? [];

  return <div className="space-y-5">
    <div><h3 className="text-sm font-black text-slate-900">Theme</h3><p className="mt-1 text-xs text-slate-500">Màu và typography được áp dụng qua CSS variables của template.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{(['primary', 'secondary', 'surface', 'text'] as const).map((key) => <label key={key} className="space-y-1"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{key}</span><Input value={value.themeConfig[key] ?? ''} onChange={(event) => setTheme(key, event.target.value)} /></label>)}</div></div>
    <div><h3 className="text-sm font-black text-slate-900">Section & route</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{sectionOptions.map(([key, label]) => <Check key={key} label={label} checked={sections.includes(key)} onChange={(checked) => setFeature('sections', checked ? [...sections, key] : sections.filter((item) => item !== key))} />)}</div><div className="mt-4 grid gap-2 sm:grid-cols-2">{routeOptions.map(([key, label]) => <Check key={key} label={`Route ${label}`} checked={routes.includes(key)} onChange={(checked) => setFeature('routes', checked ? [...routes, key] : routes.filter((item) => item !== key))} />)}</div><div className="mt-4"><Check label="Bật tính năng tải game" checked={value.featureConfig.downloads === true} onChange={(checked) => onChange({ ...value, featureConfig: { ...value.featureConfig, downloads: checked } })} /></div></div>
    <BlockEditor label="Hero" block={value.pageConfig.hero} onChange={(patch) => setBlock('hero', patch)} imageLabel="Ảnh hero được lấy từ media chung hoặc URL riêng" />
    <BlockEditor label="Giới thiệu" block={value.pageConfig.intro} onChange={(patch) => setBlock('intro', patch)} imageLabel="Ảnh minh họa giới thiệu" />
    <ItemListEditor label="Thẻ nội dung" items={value.pageConfig.featureCards} onChange={(items) => setItems('featureCards', items)} />
    <ItemListEditor label="Thư viện ảnh" items={value.pageConfig.gallery} onChange={(items) => setItems('gallery', items)} imageRequired />
    {preset === 'SCI_FI_SHOOTER' ? <><ItemListEditor label="Vai trò" items={value.pageConfig.roles} onChange={(items) => setItems('roles', items)} imageRequired /><ItemListEditor label="Khu vực" items={value.pageConfig.locations} onChange={(items) => setItems('locations', items)} imageRequired /><ItemListEditor label="Trang bị" items={value.pageConfig.equipment} onChange={(items) => setItems('equipment', items)} imageRequired /></> : null}
    {preset === 'PLAYFUL_CASUAL' ? <FaqEditor items={value.pageConfig.faqs} onChange={(faqs) => onChange({ ...value, pageConfig: { ...value.pageConfig, faqs } })} /> : null}
    <BlockEditor label="Closing CTA" block={value.pageConfig.closing} onChange={(patch) => setBlock('closing', patch)} />
  </div>;
}

function BlockEditor({ label, block, onChange, imageLabel }: { label: string; block: { eyebrow: string; title: string; description: string; imageUrl?: string | null; mobileImageUrl?: string | null }; onChange: (patch: Record<string, string | null>) => void; imageLabel?: string }) {
  return <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><legend className="px-1 text-xs font-black text-slate-800">{label}</legend><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1"><span className="text-[11px] font-bold text-slate-500">Eyebrow</span><Input value={block.eyebrow} onChange={(event) => onChange({ eyebrow: event.target.value })} /></label><label className="space-y-1"><span className="text-[11px] font-bold text-slate-500">Tiêu đề</span><Input value={block.title} onChange={(event) => onChange({ title: event.target.value })} /></label></div><label className="block space-y-1"><span className="text-[11px] font-bold text-slate-500">Mô tả</span><Textarea value={block.description} onChange={(event) => onChange({ description: event.target.value })} className="min-h-20" /></label>{imageLabel ? <p className="text-[11px] text-slate-500">{imageLabel}</p> : null}{'imageUrl' in block ? <div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1"><span className="text-[11px] font-bold text-slate-500">Ảnh desktop / chính</span><Input value={block.imageUrl ?? ''} onChange={(event) => onChange({ imageUrl: event.target.value || null })} /></label><label className="space-y-1"><span className="text-[11px] font-bold text-slate-500">Ảnh mobile</span><Input value={block.mobileImageUrl ?? ''} onChange={(event) => onChange({ mobileImageUrl: event.target.value || null })} /></label></div> : null}</fieldset>;
}

function ItemListEditor({ label, items, onChange, imageRequired }: { label: string; items: GamePageItem[]; onChange: (items: GamePageItem[]) => void; imageRequired?: boolean }) {
  const update = (index: number, patch: Partial<GamePageItem>) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  return <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><legend className="px-1 text-xs font-black text-slate-800">{label}</legend>{items.map((item, index) => <div key={`${index}-${item.title}`} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mục {index + 1}</span><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-[11px] font-bold text-rose-600">Xóa</button></div><Input value={item.title} placeholder="Tiêu đề" onChange={(event) => update(index, { title: event.target.value })} /><Textarea value={item.description ?? ''} placeholder="Mô tả" onChange={(event) => update(index, { description: event.target.value })} className="min-h-16" />{imageRequired ? <Input value={item.imageUrl ?? ''} placeholder="URL ảnh /uploads hoặc /images" onChange={(event) => update(index, { imageUrl: event.target.value || null })} /> : null}</div>)}<button type="button" onClick={() => onChange([...items, { title: '', description: '', ...(imageRequired ? { imageUrl: null } : {}) }])} className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-[#00873E] hover:text-[#00873E]">+ Thêm mục</button></fieldset>;
}

function FaqEditor({ items, onChange }: { items: Array<{ question: string; answer: string }>; onChange: (items: Array<{ question: string; answer: string }>) => void }) {
  return <fieldset className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><legend className="px-1 text-xs font-black text-slate-800">FAQ</legend>{items.map((item, index) => <div key={`${index}-${item.question}`} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3"><div className="flex justify-end"><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-[11px] font-bold text-rose-600">Xóa</button></div><Input value={item.question} placeholder="Câu hỏi" onChange={(event) => onChange(items.map((faq, faqIndex) => faqIndex === index ? { ...faq, question: event.target.value } : faq))} /><Textarea value={item.answer} placeholder="Trả lời" onChange={(event) => onChange(items.map((faq, faqIndex) => faqIndex === index ? { ...faq, answer: event.target.value } : faq))} className="min-h-16" /></div>)}<button type="button" onClick={() => onChange([...items, { question: '', answer: '' }])} className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:border-[#00873E] hover:text-[#00873E]">+ Thêm FAQ</button></fieldset>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]" />{label}</label>;
}
