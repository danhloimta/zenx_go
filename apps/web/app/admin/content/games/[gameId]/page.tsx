'use client';

import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Layers,
  Palette,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AdminContentGame,
  FeatureConfig,
  GameLifecycleStatus,
  GameOperationalStatus,
  GamePageConfig,
  GamePlatform,
  ThemeConfig,
} from '@zenx-go/api-client';
import {
  useAdminContentGame,
  useAdminContentGameOptions,
  useAdminContentGameReadiness,
} from '@/hooks/use-content';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/image-upload-field';
import {
  GamePresentationEditor,
  type PresentationValue,
} from '@/components/admin-content/game-presentation-editor';
import { toast } from 'sonner';

const lifecycleOptions: Array<{ value: GameLifecycleStatus; label: string }> = [
  { value: 'LIVE', label: 'Đang vận hành (Live)' },
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
  primaryGame: boolean;
  sortOrder: string;
  genreCodes: string[];
  platforms: GamePlatform[];
};

type ActiveTab = 'general' | 'presentation';

export default function AdminContentGameDetailPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = typeof params.gameId === 'string' ? decodeURIComponent(params.gameId) : '';
  const gameQuery = useAdminContentGame(gameId);
  const optionsQuery = useAdminContentGameOptions();
  const readinessQuery = useAdminContentGameReadiness(gameId);
  const game = gameQuery.data;
  const options = optionsQuery.data;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [form, setForm] = useState<GameForm | null>(null);
  const [presentation, setPresentation] = useState<PresentationValue | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const originalForm = game ? toForm(game) : null;
  const originalPresentation = game ? toPresentation(game) : null;

  const formChanged = Boolean(
    game && form && JSON.stringify(form) !== JSON.stringify(originalForm),
  );
  const presentationChanged = Boolean(
    game && presentation && JSON.stringify(presentation) !== JSON.stringify(originalPresentation),
  );
  const isDirty = formChanged || presentationChanged;

  // Cảnh báo người dùng nếu rời trang khi chưa lưu
  useEffect(() => {
    if (!isDirty) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeave);
    return () => window.removeEventListener('beforeunload', warnBeforeLeave);
  }, [isDirty]);

  // Đồng bộ state khi dữ liệu game tải xong
  useEffect(() => {
    if (game) {
      setForm(toForm(game));
      setPresentation(toPresentation(game));
    }
  }, [game]);

  // Mutation cập nhật thông tin chung của game
  const update = useMutation({
    mutationFn: () =>
      api.admin.content.updateGame(gameId, {
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
        primaryGame: form!.primaryGame,
        sortOrder: Number(form!.sortOrder) || 0,
        genreCodes: form!.genreCodes,
        platforms: form!.platforms,
      }),
    onSuccess: () => {
      setConfirmOpen(false);
      toast.success('Đã lưu thông tin game thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game-readiness', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'games'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Mutation lưu cấu hình giao diện & Landing page
  const savePresentation = useMutation({
    mutationFn: () =>
      api.admin.content.updateGamePresentation(gameId, {
        expectedUpdatedAt: game!.updatedAt,
        ...presentation!,
      }),
    onSuccess: () => {
      toast.success('Đã lưu cấu hình giao diện thành công.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game-readiness', gameId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Mutation public / unpublish
  const publish = useMutation({
    mutationFn: () => api.admin.content.publishGame(gameId),
    onSuccess: () => {
      toast.success('Game đã được public.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'games'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const unpublish = useMutation({
    mutationFn: () => api.admin.content.unpublishGame(gameId),
    onSuccess: () => {
      toast.success('Game đã được ẩn khỏi public.');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'game', gameId] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'games'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'content', 'dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  // Xử lý phím tắt ⌘S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeTab === 'general') {
          if (formChanged && !update.isPending) submit();
        } else {
          if (presentationChanged && !savePresentation.isPending) savePresentation.mutate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  if (gameQuery.isLoading || optionsQuery.isLoading || readinessQuery.isLoading) {
    return <GameDetailSkeleton />;
  }

  if (
    gameQuery.isError ||
    optionsQuery.isError ||
    readinessQuery.isError ||
    !game ||
    !form ||
    !options ||
    !presentation ||
    !readinessQuery.data
  ) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/content/games"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
        >
          <ArrowLeft className="size-4" /> Quay lại Catalog Game
        </Link>
        <Alert>
          {getErrorMessage(gameQuery.error ?? optionsQuery.error, 'Không thể tải thông tin game.')}
        </Alert>
      </div>
    );
  }

  const taxonomyError =
    form.genreCodes.length === 0
      ? 'Chọn ít nhất một thể loại.'
      : form.platforms.length === 0
      ? 'Chọn ít nhất một nền tảng.'
      : null;

  const identityChanged =
    form.code !== game.code || form.slug !== game.slug || form.subdomain !== game.subdomain;

  const set = <K extends keyof GameForm>(field: K, value: GameForm[K]) =>
    setForm((current) => (current ? { ...current, [field]: value } : current));

  const submit = () => {
    if (taxonomyError) {
      toast.error(taxonomyError);
      return;
    }
    if (identityChanged) setConfirmOpen(true);
    else update.mutate();
  };

  const copyGameId = () => {
    navigator.clipboard.writeText(game.id);
    setCopiedId(true);
    toast.success('Đã sao chép Game ID');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Sticky Header Action Bar */}
      <header className="sticky top-0 z-30 -mx-4 -mt-6 border-b border-slate-200/90 bg-white/95 px-4 py-3 shadow-2xs backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Breadcrumb & Title */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin/content/games"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
              title="Quay lại Catalog Game"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Catalog Game</span>
                <span className="text-slate-300">/</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
                  {game.code}
                </span>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    game.isPublic
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {game.isPublic ? <Eye className="size-3 text-emerald-600" /> : <EyeOff className="size-3 text-slate-500" />}
                  {game.isPublic ? 'Public' : 'Private'}
                </span>

                {isDirty ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Chưa lưu
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Check className="size-3 text-emerald-500" />
                    Đã đồng bộ
                  </span>
                )}
              </div>

              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {form.name || game.name}
              </h1>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <Button asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
              <Link href={`/preview/games/${encodeURIComponent(game.id)}`} target="_blank">
                <ExternalLink className="size-3.5" />
                <span className="hidden sm:inline">Xem preview</span>
              </Link>
            </Button>

            {activeTab === 'general' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!formChanged || update.isPending}
                  onClick={() => setForm(originalForm)}
                  className="h-9 gap-1.5 text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Hoàn tác</span>
                </Button>
                <Button
                  type="button"
                  disabled={!formChanged || update.isPending || Boolean(taxonomyError)}
                  onClick={submit}
                  className="h-9 gap-1.5 bg-[#00873E] text-xs text-white hover:bg-[#007234]"
                >
                  <Save className="size-3.5" />
                  <span>{update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!presentationChanged || savePresentation.isPending}
                  onClick={() => setPresentation(originalPresentation)}
                  className="h-9 gap-1.5 text-xs"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Hoàn tác</span>
                </Button>
                <Button
                  type="button"
                  disabled={!presentationChanged || savePresentation.isPending}
                  onClick={() => savePresentation.mutate()}
                  className="h-9 gap-1.5 bg-[#00873E] text-xs text-white hover:bg-[#007234]"
                >
                  <Save className="size-3.5" />
                  <span>{savePresentation.isPending ? 'Đang lưu…' : 'Lưu giao diện'}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Compact Visual Overview Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-950 p-5 text-white shadow-xs sm:p-6">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25 filter blur-xs"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {game.iconUrl ? (
              <img
                src={game.iconUrl}
                alt=""
                className="size-16 shrink-0 rounded-2xl border border-white/20 object-cover shadow-lg sm:size-18"
              />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 sm:size-18">
                <Gamepad2 className="size-8 text-white/70" />
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-white sm:text-2xl">{game.name}</h2>
                <span className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs font-bold text-white">
                  {game.code}
                </span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {game.subdomain}.zenx.games
                </span>
              </div>
              <p className="mt-1 line-clamp-1 max-w-xl text-xs text-white/75 sm:text-sm">
                {game.tagline || 'Chưa thiết lập khẩu hiệu game.'}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white/80">
                <span className="rounded-full bg-white/15 px-2.5 py-0.5">
                  Vòng đời: {game.lifecycleStatus}
                </span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5">
                  Vận hành: {game.operationalStatus}
                </span>
                <span className="rounded-full bg-indigo-500/25 px-2.5 py-0.5 text-indigo-200">
                  Template: {game.themePreset}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {readinessQuery.data.ready ? (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                <span>Sẵn sàng Public</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300">
                <AlertCircle className="size-3.5 text-amber-400" />
                <span>Cần hoàn thiện ({readinessQuery.data.errors.length})</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'general'
              ? 'border-[#00873E] text-[#00873E]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sliders className="size-4" />
          <span>Thông tin & Vận hành</span>
          {formChanged ? (
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Có thay đổi chưa lưu" />
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presentation')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === 'presentation'
              ? 'border-[#00873E] text-[#00873E]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Palette className="size-4" />
          <span>Giao diện & Landing Page</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {game.themePreset}
          </span>
          {presentationChanged ? (
            <span className="size-2 rounded-full bg-amber-500 animate-pulse" title="Có thay đổi chưa lưu" />
          ) : null}
        </button>
      </div>

      {/* 4. Tab 1: Thông tin & Vận hành */}
      {activeTab === 'general' ? (
        <form
          className="grid gap-6 lg:grid-cols-12"
          onSubmit={(event) => {
            event.preventDefault();
            if (formChanged) submit();
          }}
        >
          {/* Cột trái: Form thông tin chi tiết */}
          <div className="space-y-6 lg:col-span-8">
            <Section
              title="Định danh & Đường dẫn"
              description="Code, slug và subdomain tạo nên URL chính thức của game trên hệ sinh thái Zenx."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Mã Code" hint="Chữ hoa, số, _ hoặc -">
                  <Input
                    value={form.code}
                    onChange={(event) => set('code', event.target.value.toUpperCase())}
                    required
                  />
                </Field>
                <Field label="Đường dẫn Slug" hint="Chuẩn hóa kebab-case">
                  <Input
                    value={form.slug}
                    onChange={(event) => set('slug', event.target.value)}
                    required
                  />
                </Field>
                <Field label="Tên miền phụ (Subdomain)" hint="Ví dụ: lucdia">
                  <Input
                    value={form.subdomain}
                    onChange={(event) => set('subdomain', event.target.value.toLowerCase())}
                    required
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs text-slate-600">
                <span className="font-bold text-slate-700">URL công khai dự kiến: </span>
                <code className="font-mono font-semibold text-[#00873E]">
                  https://{form.subdomain || 'subdomain'}.zenx.games/{form.slug || 'slug'}
                </code>
              </div>
            </Section>

            <Section
              title="Nội dung cơ bản"
              description="Tên, khẩu hiệu và nội dung giới thiệu hiển thị trên Catalog và trang chủ game."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tên game">
                  <Input
                    value={form.name}
                    onChange={(event) => set('name', event.target.value)}
                    required
                  />
                </Field>
                <Field label="Khẩu hiệu (Tagline)">
                  <Input
                    value={form.tagline}
                    onChange={(event) => set('tagline', event.target.value)}
                    placeholder="Ví dụ: Đấu trường sinh tồn đỉnh cao"
                  />
                </Field>
              </div>
              <Field label="Mô tả ngắn gọn">
                <Textarea
                  value={form.shortDescription}
                  onChange={(event) => set('shortDescription', event.target.value)}
                  className="min-h-20"
                  placeholder="Mô tả tóm tắt hiển thị trên card catalog..."
                />
              </Field>
              <Field label="Mô tả chi tiết">
                <Textarea
                  value={form.longDescription}
                  onChange={(event) => set('longDescription', event.target.value)}
                  className="min-h-32"
                  placeholder="Giới thiệu đầy đủ về bối cảnh, cốt truyện, tính năng..."
                />
              </Field>
            </Section>

            <Section
              title="Hình ảnh & Media"
              description="Tải lên và cắt ảnh trực tiếp theo tỷ lệ chuẩn cho từng vị trí hiển thị."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploadField
                  label="Logo game (PNG trong suốt)"
                  value={form.logoUrl}
                  onChange={(value) => set('logoUrl', value)}
                  aspectRatio="free"
                />
                <ImageUploadField
                  label="Icon đại diện (App icon)"
                  value={form.iconUrl}
                  onChange={(value) => set('iconUrl', value)}
                  aspectRatio="1:1"
                />
                <ImageUploadField
                  label="Ảnh bìa Catalog"
                  value={form.coverUrl}
                  onChange={(value) => set('coverUrl', value)}
                  aspectRatio="16:9"
                />
                <ImageUploadField
                  label="Hero Desktop"
                  value={form.heroDesktopUrl}
                  onChange={(value) => set('heroDesktopUrl', value)}
                  aspectRatio="16:9"
                />
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="Hero Mobile"
                    value={form.heroMobileUrl}
                    onChange={(value) => set('heroMobileUrl', value)}
                    aspectRatio="9:16"
                  />
                </div>
              </div>
            </Section>

            <Section
              title="Nút Kêu gọi Hành động (CTA Buttons)"
              description="Cấu hình nhãn nút và đường dẫn đích khi người chơi bấm nút hành động trên trang game."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nhãn CTA chính">
                  <Input
                    value={form.primaryCtaLabel}
                    placeholder="Ví dụ: Tải game ngay"
                    onChange={(event) => set('primaryCtaLabel', event.target.value)}
                  />
                </Field>
                <Field label="Đường dẫn CTA chính">
                  <Input
                    value={form.primaryCtaPath}
                    placeholder="/download hoặc link tải"
                    onChange={(event) => set('primaryCtaPath', event.target.value)}
                  />
                </Field>
                <Field label="Nhãn CTA phụ">
                  <Input
                    value={form.secondaryCtaLabel}
                    placeholder="Ví dụ: Nạp thẻ"
                    onChange={(event) => set('secondaryCtaLabel', event.target.value)}
                  />
                </Field>
                <Field label="Đường dẫn CTA phụ">
                  <Input
                    value={form.secondaryCtaPath}
                    placeholder="/recharge hoặc link portal"
                    onChange={(event) => set('secondaryCtaPath', event.target.value)}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* Cột phải: Sticky Control Panel tinh gọn & dễ tương tác */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
              {/* Card 1: Hành động & Trạng thái xuất bản */}
              <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Xuất bản & Thao tác
                </h3>

                <div className="mt-3.5 space-y-3">
                  <Button
                    type="submit"
                    disabled={!formChanged || update.isPending || Boolean(taxonomyError)}
                    className="w-full bg-[#00873E] text-white hover:bg-[#007234]"
                  >
                    <Save className="mr-1.5 size-4" />
                    {update.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!formChanged || update.isPending}
                    onClick={() => setForm(originalForm)}
                    className="w-full text-xs"
                  >
                    <RotateCcw className="mr-1.5 size-3.5" /> Hoàn tác chỉnh sửa
                  </Button>
                </div>

                {/* Hộp kiểm tra điều kiện xuất bản (Readiness) */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div
                    className={`rounded-2xl p-3.5 text-xs ${
                      readinessQuery.data.ready
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                        : 'border border-amber-200 bg-amber-50 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {readinessQuery.data.ready ? (
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="size-4 text-amber-600 shrink-0" />
                      )}
                      <p className="font-black">
                        {readinessQuery.data.ready
                          ? 'Đã đủ điều kiện để Public'
                          : `Còn ${readinessQuery.data.errors.length} điều kiện cần bổ sung:`}
                      </p>
                    </div>

                    {readinessQuery.data.errors.length > 0 ? (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] font-medium text-amber-800">
                        {readinessQuery.data.errors.map((error) => (
                          <li key={`${error.field}-${error.message}`}>{error.message}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  {game.isPublic ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={unpublish.isPending}
                      onClick={() => unpublish.mutate()}
                      className="mt-3 w-full border-rose-200 text-rose-700 hover:bg-rose-50"
                    >
                      <EyeOff className="mr-1.5 size-3.5" />
                      {unpublish.isPending ? 'Đang ẩn…' : 'Ẩn khỏi Public'}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={!readinessQuery.data.ready || publish.isPending}
                      onClick={() => publish.mutate()}
                      className="mt-3 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Eye className="mr-1.5 size-3.5" />
                      {publish.isPending ? 'Đang public…' : 'Public game ngay'}
                    </Button>
                  )}
                </div>
              </section>

              {/* Card 2: Trạng thái Vận hành */}
              <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Vận hành & Phát hành
                </h3>

                <div className="mt-3.5 space-y-3.5">
                  <Field label="Vòng đời sản phẩm">
                    <Select
                      value={form.lifecycleStatus}
                      onChange={(event) =>
                        set('lifecycleStatus', event.target.value as GameLifecycleStatus)
                      }
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
                      onChange={(event) =>
                        set('operationalStatus', event.target.value as GameOperationalStatus)
                      }
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
                        onChange={(event) => set('releaseYear', event.target.value)}
                      />
                    </Field>
                    <Field label="Thứ tự ưu tiên">
                      <Input
                        type="number"
                        value={form.sortOrder}
                        onChange={(event) => set('sortOrder', event.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="space-y-2 pt-1">
                    <Toggle
                      label="Game nổi bật (Ghim đầu Catalog)"
                      checked={form.featured}
                      onChange={(value) => set('featured', value)}
                    />
                    <Toggle
                      label="Game chủ lực (Primary Game)"
                      checked={form.primaryGame}
                      onChange={(value) => set('primaryGame', value)}
                    />
                  </div>
                </div>
              </section>

              {/* Card 3: Phân loại & Nền tảng */}
              <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Phân loại & Nền tảng
                </h3>

                <div className="mt-3.5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Thể loại game
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {options.genres.map((genre) => {
                        const checked = form.genreCodes.includes(genre.code);
                        const inactive = !genre.isActive;
                        return (
                          <label
                            key={genre.code}
                            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                              checked
                                ? 'border-[#00873E] bg-emerald-50/70 text-[#00873E]'
                                : inactive
                                  ? 'border-slate-200 bg-slate-50 text-slate-400'
                                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate">
                              {genre.name}
                              {inactive ? <span className="ml-1 text-[10px] font-medium text-slate-400">(Ngừng dùng)</span> : null}
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={inactive && !checked}
                              onChange={(e) =>
                                set(
                                  'genreCodes',
                                  e.target.checked
                                    ? [...form.genreCodes, genre.code]
                                    : form.genreCodes.filter((code) => code !== genre.code),
                                )
                              }
                              className="size-3.5 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Nền tảng hỗ trợ
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {options.platforms.map((platform) => {
                        const checked = form.platforms.includes(platform.code);
                        return (
                          <label
                            key={platform.code}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border px-2.5 py-2 text-xs font-semibold transition ${
                              checked
                                ? 'border-[#00873E] bg-emerald-50/70 text-[#00873E]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span>{platform.label}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                set(
                                  'platforms',
                                  e.target.checked
                                    ? [...form.platforms, platform.code]
                                    : form.platforms.filter((code) => code !== platform.code),
                                )
                              }
                              className="size-3.5 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {taxonomyError ? (
                    <p className="text-xs font-semibold text-rose-600">{taxonomyError}</p>
                  ) : null}
                </div>
              </section>

              {/* Card 4: Metadata hệ thống */}
              <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Thông tin hệ thống
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Chỉ đọc
                  </span>
                </div>

                <div className="mt-3.5 space-y-2.5 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5">
                    <p className="font-semibold text-slate-500">Mã Game ID</p>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <code className="truncate font-mono text-slate-800">{game.id}</code>
                      <button
                        type="button"
                        onClick={copyGameId}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-800"
                        title="Sao chép Game ID"
                      >
                        {copiedId ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <p className="font-semibold text-slate-500">Tạo lúc</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {new Date(game.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5">
                      <p className="font-semibold text-slate-500">Cập nhật</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {new Date(game.updatedAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>
      ) : (
        /* 5. Tab 2: Thiết kế Landing Page & Template */
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Cột trái: Trình biên tập trực quan rộng rãi cho Landing Page */}
          <div className="space-y-6 lg:col-span-8">
            <GamePresentationEditor
              value={presentation}
              preset={game.themePreset}
              onChange={setPresentation}
            />
          </div>

          {/* Cột phải: Sticky Panel điều khiển giao diện & Mục lục nhanh */}
          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-5 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
              {/* Card Điều khiển Landing Page */}
              <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900">Thiết kế Landing Page</h3>
                    <p className="text-xs text-slate-500">
                      Template:{' '}
                      <span className="font-bold text-slate-800">{game.themePreset}</span>
                    </p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]">
                    <Palette className="size-4" />
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <Button
                    type="button"
                    disabled={!presentationChanged || savePresentation.isPending}
                    onClick={() => savePresentation.mutate()}
                    className="w-full bg-[#00873E] text-white hover:bg-[#007234]"
                  >
                    <Save className="mr-1.5 size-4" />
                    {savePresentation.isPending ? 'Đang lưu…' : 'Lưu giao diện & nội dung'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={!presentationChanged || savePresentation.isPending}
                    onClick={() => setPresentation(originalPresentation)}
                    className="w-full text-xs"
                  >
                    <RotateCcw className="mr-1.5 size-3.5" /> Hoàn tác giao diện
                  </Button>

                  <Button asChild variant="outline" className="w-full text-xs">
                    <Link href={`/preview/games/${encodeURIComponent(game.id)}`} target="_blank">
                      <ExternalLink className="mr-1.5 size-3.5" /> Xem preview trang game
                    </Link>
                  </Button>
                </div>
              </section>

              {/* Card Mục lục điều hướng nhanh (Quick Navigator) */}
              <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mục lục nhanh (Quick Jump)
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Nhấp để cuộn nhanh đến phần cần biên tập:
                </p>

                <nav className="mt-3.5 space-y-1.5 text-xs font-semibold">
                  <a
                    href="#section-theme"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                  >
                    <Palette className="size-3.5 text-slate-400" />
                    <span>Theme & Bảng màu sắc</span>
                  </a>
                  <a
                    href="#section-features"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                  >
                    <Layers className="size-3.5 text-slate-400" />
                    <span>Bật/Tắt Sections & Routes</span>
                  </a>
                  <a
                    href="#section-hero"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                  >
                    <Sparkles className="size-3.5 text-slate-400" />
                    <span>Khối Banner Hero</span>
                  </a>
                  <a
                    href="#section-intro"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                  >
                    <Sparkles className="size-3.5 text-slate-400" />
                    <span>Khối Giới thiệu game</span>
                  </a>
                  <a
                    href="#section-cards"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                  >
                    <Layers className="size-3.5 text-slate-400" />
                    <span>Thẻ tính năng nổi bật</span>
                  </a>
                  <a
                    href="#section-gallery"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                  >
                    <Layers className="size-3.5 text-slate-400" />
                    <span>Thư viện hình ảnh</span>
                  </a>
                  {game.themePreset === 'PLAYFUL_CASUAL' ? (
                    <a
                      href="#section-faqs"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                    >
                      <Sparkles className="size-3.5 text-slate-400" />
                      <span>Câu hỏi thường gặp FAQ</span>
                    </a>
                  ) : null}
                  <a
                    href="#section-closing"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#00873E]"
                  >
                    <Sparkles className="size-3.5 text-slate-400" />
                    <span>Khối Kêu gọi hành động (CTA)</span>
                  </a>
                </nav>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận đổi định danh (Code, Slug, Subdomain) */}
      {confirmOpen ? (
        <ConfirmDialog
          pending={update.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => update.mutate()}
        />
      ) : null}
    </div>
  );
}

// Section Wrapper
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7">
      <div className="border-b border-slate-100 pb-3.5">
        <h2 className="font-black text-slate-900 sm:text-lg">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

// Field Input Wrapper
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-slate-500">{hint}</span> : null}
    </label>
  );
}

// Toggle Switch Wrapper
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
      />
    </label>
  );
}

// Confirm Dialog when Identity changes
function ConfirmDialog({
  pending,
  onCancel,
  onConfirm,
}: {
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="identity-confirm-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <h2 id="identity-confirm-title" className="text-lg font-black text-slate-900">
              Xác nhận thay đổi định danh
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Mã Code, Slug hoặc Subdomain đang thay đổi. Các liên kết cũ sẽ không được tự động
              chuyển hướng. Bạn có chắc chắn muốn lưu các thay đổi này?
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            {pending ? 'Đang lưu…' : 'Xác nhận lưu'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function toForm(game: AdminContentGame): GameForm {
  return {
    code: game.code,
    slug: game.slug,
    subdomain: game.subdomain,
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
    primaryGame: game.primaryGame,
    sortOrder: String(game.sortOrder),
    genreCodes: game.genres.map((genre) => genre.code),
    platforms: game.platforms.filter(isGamePlatform),
  };
}

function toPresentation(game: AdminContentGame): PresentationValue {
  return {
    themeConfig: parseStored<ThemeConfig>(game.themeConfig),
    featureConfig: parseStored<FeatureConfig>(game.featureConfig),
    pageConfig: parseStored<GamePageConfig>(game.pageConfig),
  };
}

function parseStored<T>(value: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return {} as T;
  }
}

function isGamePlatform(value: string): value is GamePlatform {
  return value === 'PC' || value === 'MOBILE' || value === 'WEB';
}

function GameDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-44 rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-[600px] rounded-3xl lg:col-span-8" />
        <Skeleton className="h-[600px] rounded-3xl lg:col-span-4" />
      </div>
    </div>
  );
}
