'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Info,
  KeyRound,
  Lock,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ApiError, type AdminAuthSettings } from '@zenx-go/api-client';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAuthSettings, useUpdateAdminAuthSettings } from '@/hooks/use-auth-settings';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

type FormState = {
  google: boolean;
  facebook: boolean;
  otpRequired: boolean;
};

type FormBaseline = FormState & { updatedAt: string };

export default function AdminAuthSettingsPage() {
  const settings = useAdminAuthSettings();
  const updateSettings = useUpdateAdminAuthSettings();
  const [form, setForm] = useState<FormState | null>(null);
  const [baseline, setBaseline] = useState<FormBaseline | null>(null);
  const [notice, setNotice] = useState<{
    kind: 'success' | 'error' | 'conflict';
    text: string;
    canReload?: boolean;
  } | null>(null);
  const [isConflictReloading, setIsConflictReloading] = useState(false);

  useEffect(() => {
    if (!settings.data || !settings.isSuccess || settings.fetchStatus !== 'idle') return;
    if (form && baseline && isDirty(form, baseline)) return;
    const next = formStateFrom(settings.data);
    if (
      baseline?.updatedAt === settings.data.updatedAt &&
      form &&
      form.google === next.google &&
      form.facebook === next.facebook &&
      form.otpRequired === next.otpRequired
    ) {
      return;
    }
    setForm(next);
    setBaseline({ ...next, updatedAt: settings.data.updatedAt });
  }, [baseline, form, settings.data, settings.dataUpdatedAt, settings.fetchStatus, settings.isSuccess]);

  if (settings.isLoading || !form || !baseline) {
    if (settings.isError) {
      return (
        <div className="w-full space-y-6">
          <PageHeader
            title="Cài đặt hệ thống"
            icon={Settings}
            description="Quản lý cấu hình đăng nhập, xác thực và các chính sách bảo mật của hệ thống."
          />
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Không thể tải cài đặt đăng nhập và xác thực.</p>
                <p className="mt-0.5 text-xs text-rose-600">
                  Đã xảy ra sự cố kết nối tới máy chủ quản trị. Vui lòng thử lại.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                className="h-8 text-xs font-bold border-rose-300 bg-white text-rose-800 hover:bg-rose-100/50 shadow-2xs"
                variant="outline"
                size="sm"
                onClick={() => settings.refetch()}
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Thử kết nối lại
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return <SettingsSkeleton />;
  }

  const dirty = isDirty(form, baseline);
  const pending = updateSettings.isPending;
  const controlsDisabled = pending || isConflictReloading;

  const save = () => {
    setNotice(null);
    updateSettings.mutate(
      {
        expectedUpdatedAt: baseline.updatedAt,
        googleLoginRegistrationEnabled: form.google,
        facebookLoginRegistrationEnabled: form.facebook,
        otpRequired: form.otpRequired,
      },
      {
        onSuccess: (updated) => {
          replaceFormWith(updated);
          toast.success('Đã lưu cài đặt xác thực và chính sách bảo mật thành công!');
          setNotice({
            kind: 'success',
            text: 'Cài đặt hệ thống đã được cập nhật và áp dụng tức thì cho toàn bộ người dùng.',
          });
        },
        onError: async (error) => {
          if (error instanceof ApiError && error.code === 'STALE_AUTH_SETTINGS_UPDATE') {
            setIsConflictReloading(true);
            try {
              const result = await settings.refetch();
              if (result.isSuccess && result.data) {
                replaceFormWith(result.data);
                toast.warning('Dữ liệu đã được cập nhật bởi quản trị viên khác.');
                setNotice({
                  kind: 'conflict',
                  text: 'Cài đặt vừa được thay đổi bởi quản trị viên khác trong lúc bạn thao tác. Dữ liệu mới nhất đã được tự động tải lại.',
                });
              } else {
                setNotice({
                  kind: 'conflict',
                  text: 'Cài đặt đã bị thay đổi bởi quản trị viên khác nhưng chưa thể nạp lại dữ liệu mới. Hãy bấm nút tải lại.',
                  canReload: true,
                });
              }
            } finally {
              setIsConflictReloading(false);
            }
            return;
          }
          toast.error('Không thể lưu cài đặt hệ thống. Vui lòng thử lại.');
          setNotice({
            kind: 'error',
            text: 'Không thể lưu cài đặt. Các thay đổi của bạn vẫn được giữ nguyên trên giao diện; vui lòng thử lưu lại.',
          });
        },
      },
    );
  };

  const resetForm = () => {
    setForm({
      google: baseline.google,
      facebook: baseline.facebook,
      otpRequired: baseline.otpRequired,
    });
    setNotice(null);
    toast.info('Đã hoàn tác các thay đổi chưa lưu.');
  };

  const replaceFormWith = (serverSettings: AdminAuthSettings) => {
    const next = formStateFrom(serverSettings);
    setForm(next);
    setBaseline({ ...next, updatedAt: serverSettings.updatedAt });
  };

  const reloadAfterConflict = async () => {
    setIsConflictReloading(true);
    const result = await settings.refetch();
    setIsConflictReloading(false);
    if (result.isSuccess && result.data) {
      replaceFormWith(result.data);
      setNotice({ kind: 'conflict', text: 'Dữ liệu mới nhất đã được tải lại thành công.' });
      return;
    }
    setNotice({
      kind: 'conflict',
      text: 'Không thể tải dữ liệu mới nhất. Hãy kiểm tra kết nối mạng và thử lại.',
      canReload: true,
    });
  };

  const socialActiveCount = (form.google ? 1 : 0) + (form.facebook ? 1 : 0);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        title="Cài đặt hệ thống"
        icon={Settings}
        description="Quản lý cấu hình đăng nhập mạng xã hội, xác thực hai lớp OTP và các chính sách bảo mật của toàn bộ nền tảng."
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Hệ thống hoạt động
            </span>
            <span className="hidden sm:inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Cập nhật: {formatDate(baseline.updatedAt)}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void settings.refetch();
                toast.success('Đã làm mới dữ liệu cài đặt');
              }}
              disabled={settings.isFetching || controlsDisabled}
              className="h-8 text-xs gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <RefreshCw className={`size-3.5 ${settings.isFetching ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>

            {dirty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                disabled={controlsDisabled}
                className="h-8 text-xs gap-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <RotateCcw className="size-3.5" />
                Hoàn tác
              </Button>
            )}

            <Button
              size="sm"
              variant={dirty ? 'default' : 'outline'}
              onClick={save}
              disabled={!dirty || controlsDisabled}
              className={`h-8 text-xs gap-1.5 font-bold transition-all ${
                dirty
                  ? 'bg-[#00873E] text-white hover:bg-[#007033] shadow-xs ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-75 cursor-not-allowed shadow-none'
              }`}
            >
              <Save className="size-3.5" />
              {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        }
        className="pb-3 border-b border-slate-100"
      />

      {/* Notice Alert if present */}
      {notice && (
        <div
          className={`rounded-2xl border p-4 transition-all shadow-xs ${
            notice.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-900'
              : notice.kind === 'conflict'
                ? 'border-amber-200 bg-amber-50/90 text-amber-900'
                : 'border-rose-200 bg-rose-50/90 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {notice.kind === 'success' ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : notice.kind === 'conflict' ? (
                <AlertTriangle className="size-5 text-amber-600" />
              ) : (
                <ShieldAlert className="size-5 text-rose-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-relaxed">{notice.text}</p>
              {notice.canReload && (
                <Button
                  className="mt-3 border-amber-300 bg-white text-xs font-bold text-amber-900 hover:bg-amber-100/60 shadow-2xs"
                  variant="outline"
                  size="sm"
                  disabled={isConflictReloading}
                  onClick={reloadAfterConflict}
                >
                  <RefreshCw className={`mr-1.5 size-3.5 ${isConflictReloading ? 'animate-spin' : ''}`} />
                  {isConflictReloading ? 'Đang nạp lại dữ liệu…' : 'Tải lại dữ liệu mới nhất'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left / Main Column: Settings Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Social Login (OAuth 2.0) */}
          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-[#00873E] border border-emerald-100 shadow-2xs">
                    <Globe className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-slate-900">
                      Đăng nhập & Đăng ký Mạng xã hội (OAuth 2.0)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Bật hoặc tắt khả năng đăng nhập và đăng ký mới qua tài khoản bên thứ ba.
                    </CardDescription>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  {socialActiveCount}/2 đang bật
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Google Provider Row */}
              <div
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all duration-200 ${
                  form.google
                    ? 'border-emerald-200/90 bg-emerald-50/20 hover:border-emerald-300'
                    : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Google Official Logo */}
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                    <svg className="size-5.5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Google Authentication</h4>
                      {form.google ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          Đang bật
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          Đã tắt
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Cho phép người dùng tạo tài khoản mới và đăng nhập nhanh bằng tài khoản Google (OAuth 2.0 / OpenID Connect).
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs">
                        Google OpenID
                      </span>
                      <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs">
                        Tự động liên kết Email
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500 sm:hidden">
                    {form.google ? 'Đang kích hoạt' : 'Vô hiệu hóa'}
                  </span>
                  <Switch
                    id="google-auth-enabled"
                    checked={form.google}
                    disabled={controlsDisabled}
                    onCheckedChange={(checked) => {
                      setNotice(null);
                      setForm((cur) => (cur ? { ...cur, google: checked } : cur));
                    }}
                    aria-label="Bật hoặc tắt đăng nhập Google"
                  />
                </div>
              </div>

              {/* Facebook Provider Row */}
              <div
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all duration-200 ${
                  form.facebook
                    ? 'border-emerald-200/90 bg-emerald-50/20 hover:border-emerald-300'
                    : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Facebook Official Logo */}
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-2xs">
                    <svg className="size-6 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Facebook Login SDK</h4>
                      {form.facebook ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          Đang bật
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          Đã tắt
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Cho phép người dùng liên kết và đăng nhập bằng tài khoản Facebook qua Facebook Graph API.
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs">
                        Facebook Graph API
                      </span>
                      <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-2xs">
                        Đăng nhập 1 chạm
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500 sm:hidden">
                    {form.facebook ? 'Đang kích hoạt' : 'Vô hiệu hóa'}
                  </span>
                  <Switch
                    id="facebook-auth-enabled"
                    checked={form.facebook}
                    disabled={controlsDisabled}
                    onCheckedChange={(checked) => {
                      setNotice(null);
                      setForm((cur) => (cur ? { ...cur, facebook: checked } : cur));
                    }}
                    aria-label="Bật hoặc tắt đăng nhập Facebook"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Security & OTP Policy */}
          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-2xs">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-black text-slate-900">
                      Chính sách Bảo mật & Xác thực OTP
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Kiểm soát cơ chế bảo vệ hai lớp và yêu cầu mã xác nhận một lần (OTP).
                    </CardDescription>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <Sparkles className="size-3 text-emerald-600" />
                  Khuyến nghị bật
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* OTP Main Toggle Box */}
              <div
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all duration-200 ${
                  form.otpRequired
                    ? 'border-emerald-200/90 bg-emerald-50/20 hover:border-emerald-300'
                    : 'border-slate-200/80 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-2xs ${
                      form.otpRequired
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    <Smartphone className="size-5.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        Bắt buộc xác thực OTP cho các thao tác bảo mật
                      </h4>
                      {form.otpRequired ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-600" />
                          Bảo vệ tối đa
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Chế độ tối giản
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      Yêu cầu người dùng nhập mã OTP được gửi qua SMS / Zalo / Email để hoàn tất đăng ký tài khoản, đổi mật khẩu và đổi số điện thoại.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500 sm:hidden">
                    {form.otpRequired ? 'Đang bật OTP' : 'Đang tắt OTP'}
                  </span>
                  <Switch
                    id="otp-required-enabled"
                    checked={form.otpRequired}
                    disabled={controlsDisabled}
                    onCheckedChange={(checked) => {
                      setNotice(null);
                      setForm((cur) => (cur ? { ...cur, otpRequired: checked } : cur));
                    }}
                    aria-label="Yêu cầu OTP khi thực hiện thao tác bảo mật"
                  />
                </div>
              </div>

              {/* Policy Scope Breakdown */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Phạm vi bảo vệ của công tắc OTP:
                  </h5>
                  <span className="text-[11px] text-slate-400">Áp dụng tức thì khi lưu</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Đăng ký tài khoản mới</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {form.otpRequired
                          ? 'Bắt buộc nhập OTP số điện thoại trước khi tạo tài khoản.'
                          : 'Đăng ký nhanh không cần xác minh OTP số điện thoại.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Đổi mật khẩu & Reset</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {form.otpRequired
                          ? 'Xác thực OTP trước khi cho phép thay đổi mật khẩu.'
                          : 'Chỉ yêu cầu mật khẩu hiện tại mà không cần gửi OTP.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-2.5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Cập nhật số điện thoại</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {form.otpRequired
                          ? 'Gửi mã xác thực về số điện thoại mới trước khi liên kết.'
                          : 'Cập nhật trực tiếp số điện thoại mới.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs">
                    <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <Lock className="size-2.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Luồng nhạy cảm (Email / Ví)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Luôn bắt buộc OTP theo chuẩn bảo mật tối cao của hệ thống.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: System Insights & Security Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* System Security Status Widget */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#00873E]/10 text-[#00873E]">
                <Shield className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Tình trạng an toàn
                </h4>
                <p className="text-[11px] text-slate-400">Đánh giá cấu hình xác thực</p>
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white p-4 border border-emerald-100/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Mức độ bảo vệ:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                  {form.otpRequired ? 'Tối ưu (Khuyên dùng)' : 'Trung bình'}
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
                <div
                  className="h-full bg-[#00873E] rounded-full transition-all duration-500"
                  style={{ width: form.otpRequired ? (socialActiveCount > 0 ? '100%' : '80%') : '60%' }}
                />
              </div>
              <p className="mt-2 text-[11px] text-emerald-700 leading-relaxed">
                {form.otpRequired
                  ? 'Hệ thống đang được bảo vệ toàn diện với xác thực OTP và mã hóa đa tầng.'
                  : 'Khuyến khích bật xác thực OTP để giảm thiểu rủi ro bị tấn công vét cạn tài khoản.'}
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500">Mạng xã hội kích hoạt:</span>
                <span className="font-bold text-slate-800">{socialActiveCount} / 2 nhà cung cấp</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500">Bảo mật hai lớp OTP:</span>
                <span className={`font-bold ${form.otpRequired ? 'text-emerald-700' : 'text-amber-600'}`}>
                  {form.otpRequired ? 'Đang kích hoạt' : 'Đang vô hiệu'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500">Thuật toán băm mật khẩu:</span>
                <span className="font-mono font-bold text-slate-800">Argon2id</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500">Khóa phiên bản (Optimistic):</span>
                <span className="font-bold text-emerald-700">Kích hoạt</span>
              </div>
            </div>
          </div>

          {/* Quick Guidelines Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Info className="size-4 text-blue-600" />
              <h4 className="text-xs font-black uppercase tracking-wider">Lưu ý quản trị viên</h4>
            </div>

            <ul className="space-y-2 text-xs text-slate-500 leading-relaxed list-disc list-inside">
              <li>
                <strong className="text-slate-700">Tài khoản hiện có:</strong> Bật/tắt phương thức mạng xã hội không ảnh hưởng đến các tài khoản đã liên kết trước đây.
              </li>
              <li>
                <strong className="text-slate-700">Hủy liên kết:</strong> Người dùng vẫn có thể hủy liên kết tài khoản mạng xã hội trong trang cá nhân kể cả khi tính năng này tạm tắt.
              </li>
              <li>
                <strong className="text-slate-700">Chống xung đột:</strong> Hệ thống sử dụng timestamp phiên bản để chống ghi đè khi nhiều quản trị viên cùng thao tác.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Save Toolbar when changes exist */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 backdrop-blur-md px-5 py-3 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Có thay đổi chưa lưu</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          <Button
            variant="ghost"
            size="sm"
            onClick={resetForm}
            disabled={controlsDisabled}
            className="h-8 text-xs text-slate-600 hover:text-slate-900"
          >
            Hủy
          </Button>

          <Button
            size="sm"
            onClick={save}
            disabled={controlsDisabled}
            className="h-8 px-4 text-xs font-bold bg-[#00873E] text-white hover:bg-[#007033] shadow-xs"
          >
            <Save className="mr-1.5 size-3.5" />
            {pending ? 'Đang lưu…' : 'Lưu cài đặt ngay'}
          </Button>
        </div>
      )}
    </div>
  );
}

function formStateFrom(settings: AdminAuthSettings): FormState {
  return {
    google: settings.googleLoginRegistrationEnabled,
    facebook: settings.facebookLoginRegistrationEnabled,
    otpRequired: settings.otpRequired ?? settings.phoneRegistrationOtpRequired ?? true,
  };
}

function isDirty(form: FormState, baseline: FormState) {
  return (
    form.google !== baseline.google ||
    form.facebook !== baseline.facebook ||
    form.otpRequired !== baseline.otpRequired
  );
}

function SettingsSkeleton() {
  return (
    <div className="w-full space-y-6" aria-label="Đang tải cài đặt">
      <Skeleton className="h-20 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-72 w-full rounded-3xl" />
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
