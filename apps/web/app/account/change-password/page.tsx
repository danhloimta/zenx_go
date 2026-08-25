'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const schema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới cần ít nhất 8 ký tự.')
      .regex(/[a-z]/, 'Mật khẩu mới cần có chữ thường.')
      .regex(/[A-Z]/, 'Mật khẩu mới cần có chữ hoa.')
      .regex(/\d/, 'Mật khẩu mới cần có chữ số.')
      .regex(/[^A-Za-z\d]/, 'Mật khẩu mới cần có ký tự đặc biệt.'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu nhập lại chưa khớp.',
  });
type Values = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const account = useAccount();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const change = useMutation({
    mutationFn: ({ confirmPassword: _confirmPassword, ...value }: Values) =>
      api.account.changePassword(value),
    onSuccess: () => {
      toast.success('Đã đổi mật khẩu thành công.');
      form.reset();
      void account.refetch();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (account.isLoading) return <Skeleton className="mx-auto h-[480px] max-w-2xl rounded-2xl" />;
  if (account.isError || !account.data) return <Alert>Không thể tải thông tin tài khoản.</Alert>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Đổi mật khẩu</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-6">Cập nhật mật khẩu</h2>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((value) => {
            if (account.data?.hasPassword && !value.currentPassword) {
              form.setError('currentPassword', { message: 'Vui lòng nhập mật khẩu hiện tại.' });
              return;
            }
            change.mutate(value);
          })}
        >
          {account.data.hasPassword ? (
            <FormField
              label="Mật khẩu hiện tại"
              htmlFor="current-password"
              error={form.formState.errors.currentPassword?.message}
            >
              <PasswordInput
                id="current-password"
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
                {...form.register('currentPassword', { required: 'Vui lòng nhập mật khẩu hiện tại.' })}
              />
            </FormField>
          ) : (
            <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
              Tài khoản chưa có mật khẩu. Hãy tạo mật khẩu để có thêm phương thức đăng nhập dự phòng.
            </p>
          )}

          <FormField
            label="Mật khẩu mới"
            htmlFor="new-password"
            error={form.formState.errors.newPassword?.message}
          >
            <PasswordInput
              id="new-password"
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
              {...form.register('newPassword')}
            />
          </FormField>

          <FormField
            label="Nhập lại mật khẩu mới"
            htmlFor="confirm-password"
            error={form.formState.errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirm-password"
              placeholder="Xác nhận mật khẩu mới"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4">
            <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
              <Link href="/account/security">Hủy</Link>
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs font-semibold shadow-sm"
              disabled={change.isPending}
            >
              {change.isPending ? 'Đang cập nhật…' : 'Lưu mật khẩu'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
