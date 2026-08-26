'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAccount } from '@/hooks/use-account';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Vui lòng nhập họ tên.'),
  dateOfBirth: z.string().min(1, 'Vui lòng chọn ngày sinh.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNSPECIFIED']),
  city: z.string().trim().min(2, 'Vui lòng nhập tỉnh/thành phố.'),
  address: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function RequiredLabel({ children }: Readonly<{ children: string }>) {
  return (
    <>
      {children}
      <span className="ml-1 text-red-500" aria-hidden="true">
        *
      </span>
      <span className="sr-only"> (bắt buộc)</span>
    </>
  );
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const account = useAccount();
  const hasPrefilledProfile = useRef(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', dateOfBirth: '', gender: 'UNSPECIFIED', city: '', address: '' },
  });

  useEffect(() => {
    if (!account.data || hasPrefilledProfile.current) return;
    const profile = account.data.profile;
    form.reset({
      fullName: profile.fullName ?? '',
      dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? '',
      gender: profile.gender ?? 'UNSPECIFIED',
      city: profile.city ?? '',
      address: profile.address ?? '',
    });
    hasPrefilledProfile.current = true;
  }, [account.data, form]);

  const save = useMutation({
    mutationFn: api.account.completeProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['account', 'me'], data);
      toast.success('Đã hoàn thiện hồ sơ.');
      router.replace('/account/profile');
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-240px)] max-w-[700px] items-center justify-center">
      <Card className="w-full">
        <CardHeader className="text-center">
          <BrandLogo className="mx-auto mb-5" />
          <CardTitle className="text-2xl">Hoàn thiện hồ sơ của bạn</CardTitle>
          <p className="mt-2 text-sm font-medium text-[#00873E]">Đăng nhập thành công.</p>
          <p className="mt-1 text-sm text-slate-500">
            Thông tin có sẵn từ Google đã được điền vào form. Các trường có{' '}
            <span className="text-red-500">*</span> là bắt buộc.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-5 sm:grid-cols-2"
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
          >
            <div className="sm:col-span-2">
              <FormField
                label={<RequiredLabel>Họ và tên</RequiredLabel>}
                htmlFor="complete-fullName"
                error={form.formState.errors.fullName?.message}
              >
                <Input
                  id="complete-fullName"
                  placeholder="Nguyễn Văn A"
                  {...form.register('fullName')}
                />
              </FormField>
            </div>
            <FormField
              label={<RequiredLabel>Ngày sinh</RequiredLabel>}
              htmlFor="complete-dob"
              error={form.formState.errors.dateOfBirth?.message}
            >
              <Input id="complete-dob" type="date" {...form.register('dateOfBirth')} />
            </FormField>
            <FormField label={<RequiredLabel>Giới tính</RequiredLabel>} htmlFor="complete-gender">
              <Select id="complete-gender" {...form.register('gender')}>
                <option value="UNSPECIFIED">Chưa xác định</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </Select>
            </FormField>
            <div className="sm:col-span-2">
              <FormField
                label={<RequiredLabel>Tỉnh / Thành phố</RequiredLabel>}
                htmlFor="complete-city"
                error={form.formState.errors.city?.message}
              >
                <Input
                  id="complete-city"
                  placeholder="Thành phố Hồ Chí Minh"
                  {...form.register('city')}
                />
              </FormField>
            </div>
            <div className="sm:col-span-2">
              <FormField label="Địa chỉ (tùy chọn)" htmlFor="complete-address">
                <Input
                  id="complete-address"
                  placeholder="123 Đường Nguyễn Huệ, Quận 1"
                  {...form.register('address')}
                />
              </FormField>
            </div>
            <Button
              className="sm:col-span-2"
              type="submit"
              disabled={save.isPending || account.isLoading}
            >
              {save.isPending ? 'Đang lưu…' : 'Hoàn tất hồ sơ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
