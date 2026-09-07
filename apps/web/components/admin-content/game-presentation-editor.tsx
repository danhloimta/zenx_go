'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Layers,
  Palette,
  Plus,
  Trash2,
  HelpCircle,
  Sparkles,
  LayoutTemplate,
  Check,
} from 'lucide-react';
import type {
  FeatureConfig,
  GamePageConfig,
  GamePageItem,
  GameTemplatePreset,
  ThemeConfig,
} from '@zenx-go/api-client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUploadField } from '@/components/image-upload-field';

export type PresentationValue = {
  themeConfig: ThemeConfig;
  featureConfig: FeatureConfig;
  pageConfig: GamePageConfig;
};

const sectionOptions = [
  ['HERO', 'Hero banner'],
  ['GAME_INTRODUCTION', 'Giới thiệu game'],
  ['FEATURE_GRID', 'Điểm nổi bật'],
  ['PLATFORM_CARDS', 'Nền tảng hỗ trợ'],
  ['MEDIA_GALLERY', 'Thư viện hình ảnh'],
  ['ROADMAP_PREVIEW', 'Lộ trình phát triển'],
  ['ARTICLE_GRID', 'Tin tức & bài viết'],
  ['COMMUNITY_CTA', 'Cộng đồng game'],
] as const;

const routeOptions = [
  ['ABOUT', 'Trang giới thiệu'],
  ['NEWS', 'Trang tin tức'],
  ['ROADMAP', 'Trang roadmap'],
  ['DOWNLOAD', 'Trang tải game'],
] as const;

export function GamePresentationEditor({
  value,
  preset,
  onChange,
}: {
  value: PresentationValue;
  preset: GameTemplatePreset;
  onChange: (value: PresentationValue) => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    theme: true,
    features: true,
    hero: true,
    intro: false,
    cards: false,
    gallery: false,
    roles: false,
    locations: false,
    equipment: false,
    faqs: false,
    closing: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setTheme = (key: keyof ThemeConfig, next: string) =>
    onChange({
      ...value,
      themeConfig: { ...value.themeConfig, [key]: next },
    });

  const setFeature = (key: 'sections' | 'routes', next: string[]) =>
    onChange({
      ...value,
      featureConfig: { ...value.featureConfig, [key]: next },
    });

  const setBlock = (
    key: 'hero' | 'intro' | 'closing',
    patch: Record<string, string | null>,
  ) =>
    onChange({
      ...value,
      pageConfig: {
        ...value.pageConfig,
        [key]: { ...value.pageConfig[key], ...patch },
      },
    });

  const setItems = (
    key: 'featureCards' | 'gallery' | 'roles' | 'locations' | 'equipment',
    items: GamePageItem[],
  ) =>
    onChange({
      ...value,
      pageConfig: { ...value.pageConfig, [key]: items },
    });

  const sections = value.featureConfig.sections ?? [];
  const routes = value.featureConfig.routes ?? [];

  return (
    <div className="space-y-5">
      {/* 1. Theme & Bảng màu */}
      <CollapsibleCard
        id="section-theme"
        title="Theme & Bảng màu sắc"
        description="Màu sắc và kiểu chữ áp dụng qua biến CSS của giao diện template."
        icon={<Palette className="size-5 text-emerald-600" />}
        isOpen={openSections.theme}
        onToggle={() => toggleSection('theme')}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { key: 'primary', label: 'Màu chính (Primary)', defaultHex: '#00873E' },
              { key: 'secondary', label: 'Màu phụ (Secondary)', defaultHex: '#10B981' },
              { key: 'surface', label: 'Màu nền (Surface)', defaultHex: '#0F172A' },
              { key: 'text', label: 'Màu chữ (Text)', defaultHex: '#F8FAFC' },
            ] as const
          ).map(({ key, label, defaultHex }) => {
            const currentColor = value.themeConfig[key] || defaultHex;
            const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(currentColor);
            return (
              <div key={key} className="space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                <span className="text-xs font-bold text-slate-700">{label}</span>
                <div className="flex items-center gap-2">
                  <label
                    className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-slate-300 shadow-2xs transition hover:scale-105"
                    style={{ backgroundColor: isHex ? currentColor : defaultHex }}
                    title="Bấm để chọn màu"
                  >
                    <input
                      type="color"
                      value={isHex ? currentColor : defaultHex}
                      onChange={(e) => setTheme(key, e.target.value)}
                      className="absolute inset-0 size-full cursor-pointer opacity-0"
                    />
                  </label>
                  <Input
                    value={value.themeConfig[key] ?? ''}
                    placeholder={defaultHex}
                    onChange={(e) => setTheme(key, e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleCard>

      {/* 2. Sections & Routes */}
      <CollapsibleCard
        id="section-features"
        title="Bật/Tắt Sections & Routes"
        description="Lựa chọn các khối nội dung và trang con hiển thị trên landing page của game."
        icon={<Layers className="size-5 text-indigo-600" />}
        isOpen={openSections.features}
        onToggle={() => toggleSection('features')}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Các khối Section trên Trang chủ
            </h4>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              {sectionOptions.map(([key, label]) => {
                const active = sections.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-semibold transition ${
                      active
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-400/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <span>{label}</span>
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                        active
                          ? 'border-[#00873E] bg-[#00873E] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {active ? <Check className="size-3.5 stroke-[3]" /> : null}
                    </div>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) =>
                        setFeature(
                          'sections',
                          e.target.checked
                            ? [...sections, key]
                            : sections.filter((item) => item !== key),
                        )
                      }
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trang con (Sub-routes)
            </h4>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              {routeOptions.map(([key, label]) => {
                const active = routes.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-xs font-semibold transition ${
                      active
                        ? 'border-indigo-300 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-400/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <span>{label}</span>
                    <div
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {active ? <Check className="size-3.5 stroke-[3]" /> : null}
                    </div>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) =>
                        setFeature(
                          'routes',
                          e.target.checked
                            ? [...routes, key]
                            : routes.filter((item) => item !== key),
                        )
                      }
                      className="sr-only"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs font-bold text-slate-800 hover:bg-slate-100/70">
              <span>Bật tính năng tải game (Download Hub)</span>
              <input
                type="checkbox"
                checked={value.featureConfig.downloads === true}
                onChange={(e) =>
                  onChange({
                    ...value,
                    featureConfig: {
                      ...value.featureConfig,
                      downloads: e.target.checked,
                    },
                  })
                }
                className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
              />
            </label>
          </div>
        </div>
      </CollapsibleCard>

      {/* 3. Khối Hero */}
      <CollapsibleCard
        id="section-hero"
        title="Khối Banner Hero"
        description="Nội dung khẩu hiệu và ảnh nền xuất hiện ngay đầu trang game."
        icon={<LayoutTemplate className="size-5 text-sky-600" />}
        isOpen={openSections.hero}
        onToggle={() => toggleSection('hero')}
      >
        <BlockEditor
          block={value.pageConfig.hero}
          onChange={(patch) => setBlock('hero', patch)}
          hasImages
        />
      </CollapsibleCard>

      {/* 4. Khối Giới thiệu */}
      <CollapsibleCard
        id="section-intro"
        title="Khối Giới thiệu (About Game)"
        description="Thông điệp mở đầu và hình ảnh cốt truyện hoặc gameplay."
        icon={<Sparkles className="size-5 text-amber-600" />}
        isOpen={openSections.intro}
        onToggle={() => toggleSection('intro')}
      >
        <BlockEditor
          block={value.pageConfig.intro}
          onChange={(patch) => setBlock('intro', patch)}
          hasImages
        />
      </CollapsibleCard>

      {/* 5. Thẻ nội dung / Điểm nổi bật */}
      <CollapsibleCard
        id="section-cards"
        title={`Thẻ tính năng nổi bật (${value.pageConfig.featureCards.length})`}
        description="Các thẻ giới thiệu tính năng, lối chơi đặc sắc của game."
        icon={<Layers className="size-5 text-emerald-600" />}
        isOpen={openSections.cards}
        onToggle={() => toggleSection('cards')}
        badge={`${value.pageConfig.featureCards.length} thẻ`}
      >
        <ItemListEditor
          items={value.pageConfig.featureCards}
          onChange={(items) => setItems('featureCards', items)}
          itemLabel="Thẻ tính năng"
        />
      </CollapsibleCard>

      {/* 6. Thư viện ảnh */}
      <CollapsibleCard
        id="section-gallery"
        title={`Thư viện hình ảnh (${value.pageConfig.gallery.length})`}
        description="Bộ sưu tập ảnh chụp màn hình, artwork hoặc teaser."
        icon={<ImageIcon className="size-5 text-purple-600" />}
        isOpen={openSections.gallery}
        onToggle={() => toggleSection('gallery')}
        badge={`${value.pageConfig.gallery.length} ảnh`}
      >
        <ItemListEditor
          items={value.pageConfig.gallery}
          onChange={(items) => setItems('gallery', items)}
          imageRequired
          itemLabel="Ảnh thư viện"
        />
      </CollapsibleCard>

      {/* Sci-Fi Shooter Specific Sections */}
      {preset === 'SCI_FI_SHOOTER' ? (
        <>
          <CollapsibleCard
            id="section-roles"
            title={`Danh sách Vai trò / Nhân vật (${(value.pageConfig.roles ?? []).length})`}
            description="Các lớp nhân vật hoặc vai trò chiến đấu trong game."
            icon={<Sparkles className="size-5 text-blue-600" />}
            isOpen={openSections.roles}
            onToggle={() => toggleSection('roles')}
          >
            <ItemListEditor
              items={value.pageConfig.roles ?? []}
              onChange={(items) => setItems('roles', items)}
              imageRequired
              itemLabel="Nhân vật / Vai trò"
            />
          </CollapsibleCard>

          <CollapsibleCard
            id="section-locations"
            title={`Khu vực / Bản đồ (${(value.pageConfig.locations ?? []).length})`}
            description="Danh sách các map hoặc hành tinh khám phá."
            icon={<Layers className="size-5 text-cyan-600" />}
            isOpen={openSections.locations}
            onToggle={() => toggleSection('locations')}
          >
            <ItemListEditor
              items={value.pageConfig.locations ?? []}
              onChange={(items) => setItems('locations', items)}
              imageRequired
              itemLabel="Bản đồ / Khu vực"
            />
          </CollapsibleCard>

          <CollapsibleCard
            id="section-equipment"
            title={`Trang bị / Vũ khí (${(value.pageConfig.equipment ?? []).length})`}
            description="Bộ trang bị, khí tài đặc biệt trong game."
            icon={<Sparkles className="size-5 text-rose-600" />}
            isOpen={openSections.equipment}
            onToggle={() => toggleSection('equipment')}
          >
            <ItemListEditor
              items={value.pageConfig.equipment ?? []}
              onChange={(items) => setItems('equipment', items)}
              imageRequired
              itemLabel="Trang bị"
            />
          </CollapsibleCard>
        </>
      ) : null}

      {/* Playful Casual Specific: FAQ */}
      {preset === 'PLAYFUL_CASUAL' ? (
        <CollapsibleCard
          id="section-faqs"
          title={`Câu hỏi thường gặp FAQ (${(value.pageConfig.faqs ?? []).length})`}
          description="Giải đáp các thắc mắc phổ biến của người chơi mới."
          icon={<HelpCircle className="size-5 text-amber-600" />}
          isOpen={openSections.faqs}
          onToggle={() => toggleSection('faqs')}
          badge={`${(value.pageConfig.faqs ?? []).length} câu hỏi`}
        >
          <FaqEditor
            items={value.pageConfig.faqs ?? []}
            onChange={(faqs) =>
              onChange({
                ...value,
                pageConfig: { ...value.pageConfig, faqs },
              })
            }
          />
        </CollapsibleCard>
      ) : null}

      {/* 7. Closing CTA */}
      <CollapsibleCard
        id="section-closing"
        title="Khối Kêu gọi Hành động cuối trang (Closing CTA)"
        description="Lời kêu gọi tải game hoặc tham gia cộng đồng ở chân trang."
        icon={<Sparkles className="size-5 text-emerald-600" />}
        isOpen={openSections.closing}
        onToggle={() => toggleSection('closing')}
      >
        <BlockEditor
          block={value.pageConfig.closing}
          onChange={(patch) => setBlock('closing', patch)}
          hasImages={false}
        />
      </CollapsibleCard>
    </div>
  );
}

// Collapsible Section Wrapper Card
function CollapsibleCard({
  id,
  title,
  description,
  icon,
  isOpen,
  onToggle,
  badge,
  children,
}: {
  id?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5 text-left transition hover:bg-slate-50/70 sm:p-6"
      >
        <div className="flex items-center gap-3.5">
          {icon ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100/90 shadow-2xs">
              {icon}
            </span>
          ) : null}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 sm:text-base">{title}</h3>
              {badge ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {badge}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-2xs">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-slate-100 p-5 pt-4 sm:p-6 sm:pt-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

// Block Editor (for Hero, Intro, Closing)
function BlockEditor({
  block,
  onChange,
  hasImages = false,
}: {
  block: {
    eyebrow: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    mobileImageUrl?: string | null;
  };
  onChange: (patch: Record<string, string | null>) => void;
  hasImages?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700">Dòng tiêu đề phụ (Eyebrow)</span>
          <Input
            value={block.eyebrow}
            onChange={(e) => onChange({ eyebrow: e.target.value })}
            placeholder="Ví dụ: Đỉnh cao chiến thuật"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700">Tiêu đề chính</span>
          <Input
            value={block.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Ví dụ: Bước vào kỷ nguyên huyền thoại"
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-bold text-slate-700">Đoạn văn mô tả</span>
        <Textarea
          value={block.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Nhập nội dung mô tả chi tiết..."
          className="min-h-20"
        />
      </label>

      {hasImages ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploadField
            label="Ảnh hiển thị Desktop / Chính"
            value={block.imageUrl ?? ''}
            onChange={(url) => onChange({ imageUrl: url || null })}
            aspectRatio="16:9"
          />
          {'mobileImageUrl' in block ? (
            <ImageUploadField
              label="Ảnh hiển thị Mobile"
              value={block.mobileImageUrl ?? ''}
              onChange={(url) => onChange({ mobileImageUrl: url || null })}
              aspectRatio="9:16"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// Item List Editor (for Feature Cards, Gallery, Roles, Equipment, Locations)
function ItemListEditor({
  items,
  onChange,
  imageRequired = false,
  itemLabel = 'Mục',
}: {
  items: GamePageItem[];
  onChange: (items: GamePageItem[]) => void;
  imageRequired?: boolean;
  itemLabel?: string;
}) {
  const update = (index: number, patch: Partial<GamePageItem>) =>
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );

  const remove = (index: number) =>
    onChange(items.filter((_, itemIndex) => itemIndex !== index));

  const add = () =>
    onChange([
      ...items,
      {
        title: '',
        description: '',
        ...(imageRequired ? { imageUrl: null } : {}),
      },
    ]);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
          Chưa có {itemLabel.toLowerCase()} nào. Nhấp vào nút bên dưới để thêm mới.
        </div>
      ) : null}

      <div className="space-y-3.5">
        {items.map((item, index) => (
          <div
            key={`${index}-${item.title || 'untitled'}`}
            className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4 transition hover:bg-slate-50/70 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                {itemLabel} #{index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="h-7 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="mr-1 size-3.5" /> Xóa
              </Button>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Tiêu đề</span>
                  <Input
                    value={item.title}
                    placeholder="Nhập tiêu đề..."
                    onChange={(e) => update(index, { title: e.target.value })}
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">Mô tả</span>
                  <Textarea
                    value={item.description ?? ''}
                    placeholder="Mô tả chi tiết..."
                    onChange={(e) => update(index, { description: e.target.value })}
                    className="min-h-18"
                  />
                </label>
              </div>

              {imageRequired ? (
                <div>
                  <ImageUploadField
                    label="Hình ảnh minh họa"
                    value={item.imageUrl ?? ''}
                    onChange={(url) => update(index, { imageUrl: url || null })}
                    aspectRatio="16:9"
                  />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={add}
        className="w-full border-dashed border-slate-300 py-3 text-xs font-bold text-slate-700 hover:border-[#00873E] hover:bg-emerald-50/40 hover:text-[#00873E]"
      >
        <Plus className="mr-1.5 size-4" /> Thêm {itemLabel.toLowerCase()} mới
      </Button>
    </div>
  );
}

// FAQ Editor (for Playful Casual preset)
function FaqEditor({
  items,
  onChange,
}: {
  items: Array<{ question: string; answer: string }>;
  onChange: (items: Array<{ question: string; answer: string }>) => void;
}) {
  const update = (index: number, patch: Partial<{ question: string; answer: string }>) =>
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );

  const remove = (index: number) =>
    onChange(items.filter((_, itemIndex) => itemIndex !== index));

  const add = () => onChange([...items, { question: '', answer: '' }]);

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
          Chưa có câu hỏi FAQ nào.
        </div>
      ) : null}

      <div className="space-y-3.5">
        {items.map((item, index) => (
          <div
            key={`${index}-${item.question || 'q'}`}
            className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4 sm:p-5"
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                FAQ #{index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="h-7 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="mr-1 size-3.5" /> Xóa
              </Button>
            </div>

            <div className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-700">Câu hỏi</span>
                <Input
                  value={item.question}
                  placeholder="Ví dụ: Game có hỗ trợ chơi chéo (cross-play) không?"
                  onChange={(e) => update(index, { question: e.target.value })}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-bold text-slate-700">Câu trả lời</span>
                <Textarea
                  value={item.answer}
                  placeholder="Nhập câu trả lời giải đáp..."
                  onChange={(e) => update(index, { answer: e.target.value })}
                  className="min-h-16"
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={add}
        className="w-full border-dashed border-slate-300 py-3 text-xs font-bold text-slate-700 hover:border-[#00873E] hover:bg-emerald-50/40 hover:text-[#00873E]"
      >
        <Plus className="mr-1.5 size-4" /> Thêm câu hỏi FAQ mới
      </Button>
    </div>
  );
}
