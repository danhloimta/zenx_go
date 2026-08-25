'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleIcon, FacebookIcon } from '@/components/icons';

export default function SocialPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[480px] rounded-2xl max-w-3xl mx-auto" />}>
      <SocialContent />
    </Suspense>
  );
}

function SocialContent() {
  const account = useAccount();
  const client = useQueryClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const result = searchParams.get('social');
    const error = searchParams.get('social_error');
    if (result === 'linked') toast.success('Đã liên kết tài khoản mạng xã hội.');
    if (error) {
      toast.error(
        error === 'not_configured'
          ? 'Nhà cung cấp đăng nhập chưa được cấu hình.'
          : 'Không thể liên kết tài khoản mạng xã hội.',
      );
    }
  }, [searchParams]);

  const unlink = useMutation({
    mutationFn: api.social.unlink,
    onSuccess: () => {
      toast.success('Đã hủy liên kết.');
      void client.invalidateQueries({ queryKey: ['account', 'me'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (account.isLoading)
    return <Skeleton className="h-[480px] rounded-2xl max-w-3xl mx-auto" />;
  if (account.isError || !account.data)
    return <Alert>Không thể tải liên kết tài khoản.</Alert>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Liên kết tài khoản</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Đăng nhập nhanh và khôi phục tài khoản dễ dàng hơn với các tài khoản mạng xã hội.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-6">Nhà cung cấp đăng nhập</h2>
        <div className="space-y-3.5">
          {/* Google */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <GoogleIcon className="size-6 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Google</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {account.data.social.google
                    ? account.data.email ? `Đã liên kết với ${account.data.email}` : 'Đã liên kết'
                    : 'Chưa liên kết'}
                </p>
              </div>
            </div>
            {account.data.social.google ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#E8F7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#00873E]">
                  Đã liên kết
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3 text-slate-600 hover:text-red-600 hover:border-red-200"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn hủy liên kết Google không?'))
                      unlink.mutate('google');
                  }}
                  disabled={unlink.isPending}
                >
                  Hủy liên kết
                </Button>
              </div>
            ) : (
              <Button
                asChild
                size="sm"
                variant="zenx-outline"
                className="text-xs h-8 px-4 font-semibold"
              >
                <a href={api.social.oauthUrl('google')}>Liên kết</a>
              </Button>
            )}
          </div>

          {/* Facebook */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <FacebookIcon className="size-6 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Facebook</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {account.data.social.facebook ? 'Đã liên kết' : 'Chưa liên kết'}
                </p>
              </div>
            </div>
            {account.data.social.facebook ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#E8F7EC] px-2.5 py-0.5 text-[11px] font-bold text-[#00873E]">
                  Đã liên kết
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3 text-slate-600 hover:text-red-600 hover:border-red-200"
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn hủy liên kết Facebook không?'))
                      unlink.mutate('facebook');
                  }}
                  disabled={unlink.isPending}
                >
                  Hủy liên kết
                </Button>
              </div>
            ) : (
              <Button
                asChild
                size="sm"
                variant="zenx-outline"
                className="text-xs h-8 px-4 font-semibold"
              >
                <a href={api.social.oauthUrl('facebook')}>Liên kết</a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-[#E8F7EC] p-5 text-xs">
        <ShieldCheck className="size-5 shrink-0 text-[#00873E] mt-0.5" />
        <div>
          <p className="font-bold text-[#00873E]">Tài khoản của bạn được bảo vệ</p>
          <p className="mt-1 text-slate-600 text-xs leading-relaxed">
            Bạn có thể liên kết nhiều phương thức đăng nhập để khôi phục tài khoản dễ dàng hơn khi
            cần thiết.
          </p>
        </div>
      </div>
    </div>
  );
}
