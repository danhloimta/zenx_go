'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@zenx-go/api-client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminAuthSettings, useUpdateAdminAuthSettings } from '@/hooks/use-auth-settings';

type FormState = {
  google: boolean;
  facebook: boolean;
};

export default function AdminAuthSettingsPage() {
  const settings = useAdminAuthSettings();
  const updateSettings = useUpdateAdminAuthSettings();
  const [form, setForm] = useState<FormState | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error' | 'conflict'; text: string } | null>(null);

  useEffect(() => {
    if (!settings.data) return;
    setForm({
      google: settings.data.googleLoginRegistrationEnabled,
      facebook: settings.data.facebookLoginRegistrationEnabled,
    });
  }, [settings.data]);

  if (settings.isLoading || !form) {
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
    if (!settings.data) return;
    setNotice(null);
    updateSettings.mutate(
      {
        expectedUpdatedAt: settings.data.updatedAt,
        googleLoginRegistrationEnabled: form.google,
        facebookLoginRegistrationEnabled: form.facebook,
      },
      {
        onSuccess: () => {
          setNotice({
            kind: 'success',
            text: 'Đã lưu cài đặt đăng nhập mạng xã hội.',
          });
        },
        onError: async (error) => {
          if (error instanceof ApiError && error.code === 'STALE_AUTH_SETTINGS_UPDATE') {
            setNotice({
              kind: 'conflict',
              text: 'Cài đặt đã được quản trị viên khác thay đổi. Dữ liệu mới nhất đã được tải lại.',
            });
            await settings.refetch();
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

  const pending = updateSettings.isPending;

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
          {notice.text}
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
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ProviderCheckbox
            id="google-auth-enabled"
            label="Google"
            description="Cho phép người dùng đăng nhập hoặc đăng ký bằng Google."
            checked={form.google}
            disabled={pending}
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
            disabled={pending}
            onCheckedChange={(checked) => {
              setNotice(null);
              setForm((current) => current ? { ...current, facebook: checked } : current);
            }}
          />
          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button onClick={save} disabled={pending}>
              {pending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
