'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Image as ImageIcon,
  MousePointerClick,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AdminContentGame,
  GameLifecycleStatus,
  GameOperationalStatus,
} from '@zenx-go/api-client';
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
import { ImageUploadField } from '@/components/image-upload-field';
import { cn } from '@/lib/utils';

const lifecycleOptions: Array<{ value: GameLifecycleStatus; label: string; desc: string }> = [
  { value: 'LIVE', label: 'Đang vận hành (Live)', desc: 'Game chính thức mở cho người chơi' },
  { value: 'OPEN_BETA', label: 'Open Beta', desc: 'Thử nghiệm mở rộng không giới hạn' },
  { value: 'CLOSED_BETA', label: 'Closed Beta', desc: 'Thử nghiệm giới hạn số lượng' },
  { value: 'INTERNAL_TEST', label: 'Test nội bộ', desc: 'Chỉ nhân sự nội bộ truy cập' },
  { value: 'IN_DEVELOPMENT', label: 'Đang phát triển', desc: 'Trong giai đoạn lập trình' },
  { value: 'COMING_SOON', label: 'Sắp ra mắt', desc: 'Quảng bá trước ngày phát hành' },
  { value: 'CONCEPT', label: 'Ý tưởng / Nghiên cứu', desc: 'Giai đoạn thiết kế ban đầu' },
  { value: 'SUNSET', label: 'Đã đóng cửa (Sunset)', desc: 'Ngừng vận hành máy chủ' },
];

const operationalOptions: Array<{ value: GameOperationalStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Sẵn sàng phục vụ' },
  { value: 'MAINTENANCE', label: 'Đang bảo trì hệ thống' },
  { value: 'DEGRADED', label: 'Hiệu năng suy giảm' },
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
};

export default function AdminContentGameDetailPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = typeof params.gameId === 'string' ? decodeURIComponent(params.gameId) : '';
  const gameQuery = useAdminContentGame(gameId);
  const game = gameQuery.data;
  const queryClient = useQueryClient();

  const [form, setForm] = useState<GameForm | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!game) return;
    setForm(toForm(game));
  }, [game]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`Đã sao chép ${fieldName}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Không thể sao chép');
    }
  };

  const update = useMutation({
    mutationFn: () =>
      api.admin.content.updateGame(gameId, {
        ...form!,
        releaseYear: form!.releaseYear ? Number(form!.releaseYear) : null,
        sortOrder: Number(form!.sortOrder) || 0,
        expectedUpdatedAt: game!.updatedAt,
      }),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình tựa game thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'games'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (gameQuery.isLoading) return <GameDetailSkeleton />;
  if (gameQuery.isError || !game || !form) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/content/games"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#00873E]"
        >
          <ArrowLeft className="size-4" /> Quay lại danh sách game
        </Link>
        <Alert>{getErrorMessage(gameQuery.error, 'Không thể tải thông tin game.')}</Alert>
      </div>
    );
  }

  const set = <K extends keyof GameForm>(key: K, value: GameForm[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/content/games"
          className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00873E] transition"
        >
          <span className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 group-hover:border-[#00873E]/40 group-hover:text-[#00873E] group-hover:bg-[#E8F7EC]/30 transition shadow-2xs">
            <ArrowLeft className="size-3.5" />
          </span>
          <span>Quay lại Catalog Game</span>
        </Link>

        <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
          <span>Quản trị ZENX</span>
          <ChevronRight className="size-3" />
          <Link href="/admin/content" className="hover:text-slate-600">
            Nội dung & Game
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/admin/content/games" className="hover:text-slate-600">
            Kho Game
          </Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-slate-700">{game.name}</span>
        </div>
      </div>

      {/* Executive Hero Banner Card */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            {/* Game Avatar / Icon with Fallback */}
            <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-tr from-slate-800 to-slate-950 p-0.5 shadow-sm">
              {game.iconUrl ? (
                <img src={game.iconUrl} alt={game.name} className="size-full rounded-[14px] object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center rounded-[14px] bg-[#E8F7EC] text-[#00873E] font-black text-xl">
                  {game.code.slice(0, 2).toUpperCase()}
                </div>
              )}
              {game.isPublic ? (
                <span
                  title="Đang công khai trên Portal"
                  className="absolute bottom-1 right-1 size-3 rounded-full bg-emerald-500 ring-2 ring-white"
                />
              ) : (
                <span
                  title="Chế độ bảo mật / Đang ẩn"
                  className="absolute bottom-1 right-1 size-3 rounded-full bg-slate-400 ring-2 ring-white"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {game.name}
                </h1>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-black text-slate-700">
                  {game.code}
                </span>
                {game.featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                    <Sparkles className="size-3 text-amber-600" />
                    Featured
                  </span>
                ) : null}
              </div>

              <p className="max-w-2xl text-xs sm:text-sm text-slate-500">
                {game.tagline || 'Chưa thiết lập khẩu hiệu/tagline cho tựa game này.'}
              </p>

              {/* Status and Metadata Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <LifecycleBadge status={form.lifecycleStatus} />
                <OperationalBadge status={form.operationalStatus} />

                {form.isPublic ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    <Eye className="size-3" />
                    Public Portal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                    <EyeOff className="size-3" />
                    Private
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => copyToClipboard(game.id, 'Game ID')}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-mono text-slate-500 hover:border-slate-300 hover:text-slate-800 transition"
                >
                  <span>ID: {game.id.slice(0, 8)}…</span>
                  {copiedField === 'Game ID' ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {game.isPublic ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5 font-semibold text-slate-700">
                <Link href={`/preview/games/${encodeURIComponent(game.slug)}`} target="_blank">
                  <ExternalLink className="size-3.5" />
                  <span>Xem Preview Portal</span>
                </Link>
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm(toForm(game))}
              className="gap-1.5 font-semibold text-slate-600"
            >
              <RotateCcw className="size-3.5" />
              <span>Hoàn tác</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Form Content - 2-Column Responsive Layout */}
      <form
        className="grid gap-6 lg:grid-cols-12"
        onSubmit={(event) => {
          event.preventDefault();
          update.mutate();
        }}
      >
        {/* Left Column (8 of 12 cols): Content, Copywriting & Media */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Copywriting & Content Details */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E]">
                <Gamepad2 className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Nội dung hiển thị & Giới thiệu</h2>
                <p className="text-xs text-slate-400">
                  Thông tin thương hiệu, tên gọi và phần văn bản mô tả tựa game
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tên tựa game (Display Name)" required>
                  <Input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Ví dụ: ZENX Arena, Chiến Thần..."
                  />
                </Field>

                <Field label="Khẩu hiệu / Slogan (Tagline)">
                  <Input
                    value={form.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                    placeholder="Ví dụ: Đấu trường sinh tồn đỉnh cao"
                  />
                </Field>
              </div>

              <Field
                label="Mô tả ngắn (Short Description)"
                hint="Hiển thị trên thẻ game tại trang chủ, tối đa 200 ký tự"
              >
                <Textarea
                  value={form.shortDescription}
                  onChange={(e) => set('shortDescription', e.target.value)}
                  placeholder="Nhập phần tóm tắt ngắn gọn cuốn hút người chơi..."
                  className="min-h-20"
                />
              </Field>

              <Field
                label="Mô tả chi tiết (Long Description / Lore)"
                hint="Mô tả cốt truyện, lối chơi và tính năng nổi bật của game"
              >
                <Textarea
                  value={form.longDescription}
                  onChange={(e) => set('longDescription', e.target.value)}
                  placeholder="Nhập nội dung chi tiết giới thiệu toàn diện về tựa game..."
                  className="min-h-32"
                />
              </Field>
            </div>
          </section>

          {/* Card 2: Visual Assets & Multimedia Links */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <ImageIcon className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Hình ảnh & Đa phương tiện</h2>
                <p className="text-xs text-slate-400">
                  Đường dẫn hình ảnh biểu tượng, banner trang chủ và poster quảng bá
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ImageUploadField
                label="Logo game (SVG/PNG trong suốt)"
                value={form.logoUrl}
                onChange={(val) => set('logoUrl', val)}
                aspectRatio="free"
                placeholder="/images/games/logo.png hoặc /uploads/..."
                hint="Hiển thị trên thanh tiêu đề và trailer"
              />

              <ImageUploadField
                label="Icon đại diện (1:1 Square)"
                value={form.iconUrl}
                onChange={(val) => set('iconUrl', val)}
                aspectRatio="1:1"
                placeholder="/images/games/icon.png hoặc /uploads/..."
                hint="Icon launcher và biểu tượng ứng dụng"
              />

              <ImageUploadField
                label="Ảnh bìa thẻ game (Cover 16:9)"
                value={form.coverUrl}
                onChange={(val) => set('coverUrl', val)}
                aspectRatio="16:9"
                placeholder="/images/games/cover.jpg hoặc /uploads/..."
                hint="Ảnh đại diện catalog thẻ trò chơi"
              />

              <ImageUploadField
                label="Hero Banner Desktop (1920x1080)"
                value={form.heroDesktopUrl}
                onChange={(val) => set('heroDesktopUrl', val)}
                aspectRatio="16:9"
                placeholder="/images/games/hero-desktop.jpg hoặc /uploads/..."
                hint="Banner toàn màn hình trên máy tính"
              />

              <div className="sm:col-span-2">
                <ImageUploadField
                  label="Hero Banner Mobile (1080x1440 Portrait)"
                  value={form.heroMobileUrl}
                  onChange={(val) => set('heroMobileUrl', val)}
                  aspectRatio="9:16"
                  placeholder="/images/games/hero-mobile.jpg hoặc /uploads/..."
                  hint="Banner tối ưu cho thiết bị di động"
                />
              </div>
            </div>
          </section>

          {/* Card 3: Call-To-Action (CTA) Settings */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <MousePointerClick className="size-4.5" />
              </span>
              <div>
                <h2 className="text-base font-black text-slate-900">Nút Kêu gọi Hành động (CTA Buttons)</h2>
                <p className="text-xs text-slate-400">
                  Cấu hình nút bấm chính và phụ trên trang giới thiệu tựa game
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nhãn nút chính (Primary CTA Label)">
                <Input
                  value={form.primaryCtaLabel}
                  onChange={(e) => set('primaryCtaLabel', e.target.value)}
                  placeholder="Ví dụ: Chơi ngay, Tải game..."
                />
              </Field>

              <Field label="Đường dẫn nút chính (Primary CTA Path)">
                <Input
                  value={form.primaryCtaPath}
                  onChange={(e) => set('primaryCtaPath', e.target.value)}
                  placeholder="/play hoặc https://..."
                />
              </Field>

              <Field label="Nhãn nút phụ (Secondary CTA Label)">
                <Input
                  value={form.secondaryCtaLabel}
                  onChange={(e) => set('secondaryCtaLabel', e.target.value)}
                  placeholder="Ví dụ: Tìm hiểu thêm, Trailer..."
                />
              </Field>

              <Field label="Đường dẫn nút phụ (Secondary CTA Path)">
                <Input
                  value={form.secondaryCtaPath}
                  onChange={(e) => set('secondaryCtaPath', e.target.value)}
                  placeholder="/about hoặc https://discord.gg/..."
                />
              </Field>
            </div>
          </section>
        </div>

        {/* Right Column (4 of 12 cols): Operations, System Info & Save */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card 4: Operations & Visibility Controls */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
            <h2 className="text-base font-black text-slate-900">Vận hành & Phát hành</h2>
            <p className="text-xs text-slate-400">
              Thiết lập trạng thái hoạt động và khả năng hiển thị
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Vòng đời phát triển (Lifecycle)">
                <Select
                  value={form.lifecycleStatus}
                  onChange={(e) => set('lifecycleStatus', e.target.value as GameLifecycleStatus)}
                >
                  {lifecycleOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Trạng thái vận hành máy chủ">
                <Select
                  value={form.operationalStatus}
                  onChange={(e) => set('operationalStatus', e.target.value as GameOperationalStatus)}
                >
                  {operationalOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Năm phát hành">
                  <Input
                    type="number"
                    value={form.releaseYear}
                    onChange={(e) => set('releaseYear', e.target.value)}
                    placeholder="2026"
                  />
                </Field>

                <Field label="Thứ tự ưu tiên">
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => set('sortOrder', e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 p-3 hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => set('isPublic', e.target.checked)}
                    className="mt-0.5 size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Hiển thị công khai (Public)</p>
                    <p className="text-[11px] text-slate-400">
                      Cho phép người chơi nhìn thấy và truy cập trên portal
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 p-3 hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => set('featured', e.target.checked)}
                    className="mt-0.5 size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Game nổi bật (Featured)</p>
                    <p className="text-[11px] text-slate-400">
                      Đưa lên vị trí ưu tiên cao nhất tại slider trang chủ
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Card 5: System Identifiers (Read-Only) */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Thông số kỹ thuật</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Chỉ đọc
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              <TechSpecRow label="Code định danh" value={game.code} />
              <TechSpecRow label="URL Slug" value={game.slug} />
              <TechSpecRow label="Subdomain" value={game.subdomain || 'Mặc định'} />
              <TechSpecRow label="Theme Preset" value={game.themePreset} />
              <TechSpecRow
                label="Thể loại (Genre)"
                value={game.genres.map((g) => g.name).join(', ') || 'Chưa gán'}
              />
              <TechSpecRow
                label="Nền tảng (Platforms)"
                value={game.platforms.join(', ') || 'Chưa gán'}
              />
              <TechSpecRow
                label="Game cốt lõi (Primary)"
                value={game.primaryGame ? 'Có (Primary)' : 'Không'}
              />
            </div>
          </section>

          {/* Save action */}
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
            <Button
              type="submit"
              disabled={update.isPending}
              className="w-full bg-[#00873E] text-white hover:bg-[#007234] shadow-xs gap-2 font-bold py-2.5 h-auto"
            >
              <Save className="size-4" />
              <span>{update.isPending ? 'Đang lưu dữ liệu…' : 'Lưu thay đổi cấu hình'}</span>
            </Button>
          </section>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </span>
      </div>
      {children}
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
    </label>
  );
}


function TechSpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800 text-right truncate max-w-[180px]">{value}</span>
    </div>
  );
}

function LifecycleBadge({ status }: { status: GameLifecycleStatus }) {
  const isLive = status === 'LIVE';
  const isBeta = status === 'OPEN_BETA' || status === 'CLOSED_BETA';
  return (
    <span
      className={cn(
        'rounded-md px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shrink-0 border',
        isLive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
          : isBeta
            ? 'bg-blue-50 text-blue-700 border-blue-200/70'
            : 'bg-slate-100 text-slate-600 border-slate-200',
      )}
    >
      {lifecycleOptions.find((o) => o.value === status)?.label ?? status}
    </span>
  );
}

function OperationalBadge({ status }: { status: GameOperationalStatus }) {
  const isAvailable = status === 'AVAILABLE';
  const isMaint = status === 'MAINTENANCE';
  return (
    <span
      className={cn(
        'rounded-md px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shrink-0 border inline-flex items-center gap-1.5',
        isAvailable
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
          : isMaint
            ? 'bg-amber-50 text-amber-700 border-amber-200/70'
            : 'bg-red-50 text-red-700 border-red-200/70',
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          isAvailable ? 'bg-emerald-500' : isMaint ? 'bg-amber-500' : 'bg-red-500',
        )}
      />
      {operationalOptions.find((o) => o.value === status)?.label ?? status}
    </span>
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
  };
}

function GameDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48 rounded-lg" />
      <Skeleton className="h-32 w-full rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
        <div className="space-y-6 lg:col-span-4">
          <Skeleton className="h-60 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
