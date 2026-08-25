'use client';

import Link from 'next/link';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Coins,
  CreditCard,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useAccount } from '@/hooks/use-account';
import { useWallet, useWalletTransactions } from '@/hooks/use-wallet';
import { formatAmount, formatDate, mediaUrl, multiplyIntegerAmount } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ZenxCoinGoldIcon, GoogleIcon, FacebookIcon } from '@/components/icons';

export default function AccountOverviewPage() {
  const account = useAccount();
  const wallet = useWallet();
  const transactions = useWalletTransactions({ type: 'ALL', status: 'ALL' });

  const user = account.data;
  const securityChecks = [Boolean(user?.emailVerifiedAt), Boolean(user?.phoneVerifiedAt), Boolean(user?.hasPassword)];
  const securityLevel = securityChecks.every(Boolean) ? 'Tốt' : securityChecks.some(Boolean) ? 'Cơ bản' : 'Cần tăng cường';

  if (account.isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto space-y-6 pb-10">
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid gap-6 sm:grid-cols-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-10">
      {/* 1. Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-r from-white via-white to-[#F0FAF2] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex size-16 sm:size-20 shrink-0 items-center justify-center overflow-hidden rounded-full ring-4 ring-[#E8F7EC] bg-slate-100">
              {mediaUrl(user?.profile.avatarUrl) ? (
                <img
                  src={mediaUrl(user?.profile.avatarUrl)}
                  alt="Avatar"
                  className="size-full object-cover"
                />
              ) : (
                <UserRound className="size-8 sm:size-10 text-[#00873E]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Xin chào, {user?.profile.fullName || user?.username || 'bạn'}!
                </h1>
                <span className="inline-flex items-center rounded-full bg-[#E8F7EC] px-2.5 py-0.5 text-xs font-bold text-[#00873E]">
                  Đang hoạt động
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                ID: {user?.id ? user.id.slice(0, 10) : '—'} · Thành viên ZENX GO
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Email: {user?.email ?? 'Chưa cập nhật'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button asChild size="sm" className="gap-2 text-xs font-semibold shadow-sm">
              <Link href="/payment">
                <Coins className="size-4" />
                Nạp Coin
              </Link>
            </Button>
            <Button asChild variant="zenx-outline" size="sm" className="gap-2 text-xs font-semibold">
              <Link href="/account/profile">
                <UserRound className="size-4" />
                Hồ sơ cá nhân
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Key Stats Overview Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Wallet Balance Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Số dư ví ZENX</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">
                  {wallet.isLoading ? '—' : wallet.data ? formatAmount(wallet.data.balance) : '—'}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#00873E]">
                  <ZenxCoinGoldIcon className="size-3.5" /> ZENX
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 font-medium">
                {wallet.data ? `≈ ${formatAmount(multiplyIntegerAmount(wallet.data.balance, BigInt(20)))} VND` : 'Chưa có dữ liệu'}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
              <Wallet className="size-5" />
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link href="/wallet" className="font-semibold text-slate-700 hover:text-[#00873E] flex items-center gap-1">
              Chi tiết số dư <ArrowRight className="size-3.5" />
            </Link>
            <Link href="/payment" className="font-bold text-[#00873E] hover:underline">
              Nạp ngay +
            </Link>
          </div>
        </div>

        {/* Security Status Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Trạng thái bảo mật</p>
              <p className="mt-2 text-base font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="size-5 text-[#00873E]" />
                Mức độ bảo vệ: {securityLevel}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                  <Mail className="size-2.5 text-[#00873E]" /> Email {securityChecks[0] ? '✓' : '—'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                  <Phone className="size-2.5 text-[#00873E]" /> SĐT {securityChecks[1] ? '✓' : '—'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                  <Lock className="size-2.5 text-[#00873E]" /> Mật khẩu {securityChecks[2] ? '✓' : '—'}
                </span>
              </div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
              <ShieldCheck className="size-5" />
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-xs">
            <Link href="/account/security" className="font-semibold text-slate-700 hover:text-[#00873E] flex items-center gap-1">
              Kiểm tra bảo mật <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Social Accounts Card */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Liên kết tài khoản</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <GoogleIcon className="size-4 shrink-0" />
                  <span className="font-semibold text-slate-800">Google:</span>
                  <span className={user?.social.google ? 'font-bold text-[#00873E] text-[11px]' : 'text-slate-400 text-[11px]'}>
                    {user?.social.google ? 'Đã liên kết' : 'Chưa liên kết'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <FacebookIcon className="size-4 shrink-0" />
                  <span className="font-semibold text-slate-800">Facebook:</span>
                  <span className="text-slate-400 text-[11px]">
                    {user?.social.facebook ? 'Đã liên kết' : 'Chưa liên kết'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E8F7EC] text-[#00873E]">
              <UserRound className="size-5" />
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 text-xs">
            <Link href="/account/profile" className="font-semibold text-slate-700 hover:text-[#00873E] flex items-center gap-1">
              Quản lý liên kết <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Quick Actions Grid */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Lối tắt thao tác nhanh</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <QuickActionCard
            href="/payment"
            icon={<Coins className="size-5 text-[#00873E]" />}
            title="Nạp Coin"
            desc="Nạp thêm ZENX Coin vào ví"
          />
          <QuickActionCard
            href="/wallet/transactions"
            icon={<CreditCard className="size-5 text-[#00873E]" />}
            title="Lịch sử giao dịch"
            desc="Tra cứu biến động số dư"
          />
          <QuickActionCard
            href="/account/profile"
            icon={<UserRound className="size-5 text-[#00873E]" />}
            title="Cập nhật hồ sơ"
            desc="Sửa họ tên, ngày sinh, địa chỉ"
          />
          <QuickActionCard
            href="/account/change-password"
            icon={<KeyRound className="size-5 text-[#00873E]" />}
            title="Đổi mật khẩu"
            desc="Bảo vệ tài khoản định kỳ"
          />
        </div>
      </div>

      {/* 4. Recent Transactions */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Giao dịch gần đây</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Các biến động số dư mới nhất trong tài khoản của bạn.
            </p>
          </div>
          <Button asChild variant="zenx-outline" size="sm" className="text-xs font-semibold">
            <Link href="/wallet/transactions">
              Xem tất cả <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>

        <div>
          {transactions.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : transactions.isError ? (
            <p className="py-6 text-center text-xs text-red-500">Không thể tải lịch sử giao dịch.</p>
          ) : transactions.data?.items.length ? (
            <div className="divide-y divide-slate-100">
              {transactions.data.items.slice(0, 5).map((transaction) => {
                const isPositive = transaction.type !== 'DEBIT';
                return (
                  <Link
                    key={transaction.transactionNo}
                    href={`/wallet/transactions?transaction=${encodeURIComponent(
                      transaction.transactionNo,
                    )}`}
                    className="flex items-center justify-between gap-4 py-3.5 transition hover:bg-slate-50 -mx-2 px-2 rounded-lg"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                          isPositive ? 'bg-[#E8F7EC] text-[#00873E]' : 'bg-red-50 text-red-500'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="size-4" />
                        ) : (
                          <ArrowUpRight className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {transaction.description || (isPositive ? 'Nạp Coin' : 'Trừ Coin')}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(transaction.createdAt)} · Mã: {transaction.transactionNo}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-xs font-bold ${
                          isPositive ? 'text-[#00873E]' : 'text-red-500'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {formatAmount(transaction.amount)} ZENX
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={transaction.status} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-slate-400">Chưa có giao dịch nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-[#00873E] hover:bg-[#FAFDFB] hover:shadow-xs"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#E8F7EC] group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <div className="mt-3">
        <p className="text-xs font-bold text-slate-900 group-hover:text-[#00873E] transition-colors">
          {title}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">{desc}</p>
      </div>
    </Link>
  );
}
