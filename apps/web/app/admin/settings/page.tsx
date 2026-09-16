'use client';

import { useEffect, useState } from 'react';
import { ApiError, type AdminAuthSettings } from '@zenx-go/api-client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAuthSettings, useUpdateAdminAuthSettings } from '@/hooks/use-auth-settings';

type FormState = {
  google: boolean;
  facebook: boolean;
  phoneOtpRequired: boolean;
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
      form.facebook === next.facebook
    ) {
      return;
    }
    setForm(next);
    setBaseline({ ...next, updatedAt: settings.data.updatedAt });
  }, [baseline, form, settings.data, settings.dataUpdatedAt, settings.fetchStatus, settings.isSuccess]);

  if (settings.isLoading || !form || !baseline) {
    if (settings.isError) {
      return (
        <Alert>
          <p className="font-semibold">Không thể tải cài đặt đăng nhập mạng xã hội.</p>
          <Button
            className="mt-4 border-red-200 bg-white text-red-700 hover:bg-red-50"
            variant="outline"
            size="sm"
            onClick={() => settings.refetch()}
          >
            Thử lại
          </Button>
        </Alert>
      );
    }
    return <SettingsSkeleton />;
  }

  const save = () => {
    setNotice(null);
    updateSettings.mutate(
      {
        expectedUpdatedAt: baseline.updatedAt,
        googleLoginRegistrationEnabled: form.google,
        facebookLoginRegistrationEnabled: form.facebook,
        phoneRegistrationOtpRequired: form.phoneOtpRequired,
      },
      {
        onSuccess: (updated) => {
          replaceFormWith(updated);
          setNotice({
            kind: 'success',
            text: 'Đã lưu cài đặt đăng nhập mạng xã hội.',
          });
        },
        onError: async (error) => {
          if (error instanceof ApiError && error.code === 'STALE_AUTH_SETTINGS_UPDATE') {
            setIsConflictReloading(true);
            try {
              const result = await settings.refetch();
              if (result.isSuccess && result.data) {
                replaceFormWith(result.data);
                setNotice({
                  kind: 'conflict',
                  text: 'Cài đặt đã được quản trị viên khác thay đổi. Dữ liệu mới nhất đã được tải lại.',
                });
              } else {
                setNotice({
                  kind: 'conflict',
                  text: 'Cài đặt đã được quản trị viên khác thay đổi nhưng không thể tải dữ liệu mới nhất. Hãy thử lại.',
                  canReload: true,
                });
              }
            } finally {
              setIsConflictReloading(false);
            }
            return;
          }
          setNotice({
            kind: 'error',
            text: 'Không thể lưu cài đặt. Các thay đổi của bạn vẫn được giữ lại; hãy thử lưu lại.',
          });
        },
      },
    );
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
      setNotice({ kind: 'conflict', text: 'Dữ liệu mới nhất đã được tải lại.' });
      return;
    }
    setNotice({
      kind: 'conflict',
      text: 'Không thể tải dữ liệu mới nhất. Hãy thử lại.',
      canReload: true,
    });
  };

  const pending = updateSettings.isPending;
  const controlsDisabled = pending || isConflictReloading;

  return (
    <div className="mx-auto max-w-3xl">
      {notice ? (
        <Alert
          className={
            notice.kind === 'success'
              ? 'mb-5 border-emerald-200 bg-emerald-50 text-emerald-800'
              : notice.kind === 'conflict'
                ? 'mb-5 border-amber-200 bg-amber-50 text-amber-900'
                : 'mb-5'
          }
        >
          <p>{notice.text}</p>
          {notice.canReload ? (
            <Button
              className="mt-4 border-amber-300 bg-white text-amber-900 hover:bg-amber-50"
              variant="outline"
              size="sm"
              disabled={isConflictReloading}
              onClick={reloadAfterConflict}
            >
              {isConflictReloading ? 'Đang tải…' : 'Tải lại dữ liệu'}
            </Button>
          ) : null}
        </Alert>
      ) : null}

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-black text-slate-900">
            Đăng nhập & đăng ký mạng xã hội
          </CardTitle>
          <CardDescription className="leading-6 text-slate-500">
            Bật hoặc tắt khả năng đăng nhập và đăng ký mới theo từng nhà cung cấp.
            Việc liên kết và hủy liên kết tài khoản mạng xã hội hiện có không bị ảnh hưởng.
            Công tắc OTP bên dưới chỉ áp dụng cho đăng ký bằng tài khoản và không thay đổi các luồng OTP khác.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProviderCheckbox
            id="google-auth-enabled"
            label="Google"
            description="Cho phép người dùng đăng nhập hoặc đăng ký bằng Google."
            checked={form.google}
            disabled={controlsDisabled}
            onCheckedChange={(checked) => {
              setNotice(null);
              setForm((current) => current ? { ...current, google: checked } : current);
            }}
          />
          <ProviderCheckbox
            id="facebook-auth-enabled"
            label="Facebook"
            description="Cho phép người dùng đăng nhập hoặc đăng ký bằng Facebook."
            checked={form.facebook}
            disabled={controlsDisabled}
            onCheckedChange={(checked) => {
              setNotice(null);
              setForm((current) => current ? { ...current, facebook: checked } : current);
            }}
          />
          <ProviderCheckbox
            id="phone-registration-otp-enabled"
            label="Xác thực OTP số điện thoại khi đăng ký"
            description="Khi bật, người dùng phải nhập OTP SMS trước khi tạo tài khoản. Khi tắt, người dùng chỉ cần cung cấp số điện thoại; số điện thoại sẽ chưa được đánh dấu xác thực."
            checked={form.phoneOtpRequired}
            disabled={controlsDisabled}
            onCheckedChange={(checked) => {
              setNotice(null);
              setForm((current) => current ? { ...current, phoneOtpRequired: checked } : current);
            }}
          />
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button onClick={save} disabled={controlsDisabled}>
              {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formStateFrom(settings: AdminAuthSettings): FormState {
  return {
    google: settings.googleLoginRegistrationEnabled,
    facebook: settings.facebookLoginRegistrationEnabled,
    phoneOtpRequired: settings.phoneRegistrationOtpRequired,
  };
}

function isDirty(form: FormState, baseline: FormState) {
  return form.google !== baseline.google ||
    form.facebook !== baseline.facebook ||
    form.phoneOtpRequired !== baseline.phoneOtpRequired;
}

function ProviderCheckbox({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
      <Checkbox
        id={id}
        className="mt-1"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      <div>
        <label htmlFor={id} className="font-bold text-slate-800">
          {label}
        </label>
        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4" aria-label="Đang tải cài đặt">
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="ml-auto h-11 w-36" />
    </div>
  );
}
