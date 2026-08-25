'use client';

import Link from 'next/link';
import { CheckCircle2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useAccount } from '@/hooks/use-account';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function SecurityPage() {
  const account = useAccount();

  if (account.isLoading) return <Skeleton className="h-[480px] rounded-2xl max-w-4xl mx-auto" />;
  if (account.isError || !account.data) return <Alert>Không thể tải thông tin bảo mật.</Alert>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Bảo mật</h1>
        <p className="mt-0.5 text-xs text-slate-500">
          Kiểm tra trạng thái bảo vệ và quản lý bảo mật tài khoản của bạn.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
          <ShieldCheck className="size-5 text-[#00873E]" />
          Trạng thái bảo mật
        </h2>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <SecurityRow
            icon={<Mail className="size-5 text-[#00873E]" />}
            title="Email"
            value={account.data.email ?? 'Chưa cập nhật'}
            verified={Boolean(account.data.emailVerifiedAt)}
          />
          <SecurityRow
            icon={<Phone className="size-5 text-[#00873E]" />}
            title="Số điện thoại"
            value={account.data.phone ?? 'Chưa cập nhật'}
            verified={Boolean(account.data.phoneVerifiedAt)}
          />
          <SecurityRow
            icon={<ShieldCheck className="size-5 text-[#00873E]" />}
            title="Mật khẩu"
            value={account.data.hasPassword ? 'Mật khẩu đã được thiết lập' : 'Chưa thiết lập mật khẩu'}
            verified={account.data.hasPassword}
            verifiedLabel="Đã thiết lập"
            unverifiedLabel="Chưa thiết lập"
          />
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold text-slate-900">Tăng cường bảo mật</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Đổi mật khẩu định kỳ và liên kết thêm phương thức đăng nhập mạng xã hội.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <Button asChild variant="outline" size="sm" className="text-xs font-semibold">
            <Link href="/account/change-password">Đổi mật khẩu</Link>
          </Button>
          <Button asChild size="sm" className="text-xs font-semibold shadow-sm">
            <Link href="/account/social">Liên kết tài khoản</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SecurityRow({
  icon,
  title,
  value,
  verified,
  verifiedLabel = 'Đã xác thực',
  unverifiedLabel = 'Chưa xác thực',
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  verified: boolean;
  verifiedLabel?: string;
  unverifiedLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7EC]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-slate-900">{title}</p>
        <p className="truncate text-xs text-slate-500 mt-0.5">{value}</p>
      </div>
      <Badge variant={verified ? 'success' : 'warning'} className="text-[11px]">
        {verified ? (
          <>
            <CheckCircle2 className="mr-1 inline size-3" />
            {verifiedLabel}
          </>
        ) : (
          unverifiedLabel
        )}
      </Badge>
    </div>
  );
}
