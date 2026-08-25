'use client';

import Link from 'next/link';
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Coins, WalletCards } from 'lucide-react';
import { useWallet, useWalletTransactions } from '@/hooks/use-wallet';
import { formatAmount, formatDate, isPositiveTransaction } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { ZenxCoinGoldIcon } from '@/components/icons';

export default function WalletPage() {
  const wallet = useWallet();
  const transactions = useWalletTransactions({ type: 'ALL', status: 'ALL' });

  return (
    <div className="max-w-[1100px] mx-auto space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Số dư ví</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Theo dõi số dư và các giao dịch gần đây trong tài khoản.
          </p>
        </div>
        <Button asChild className="gap-2 font-semibold text-xs shadow-sm">
          <Link href="/payment">
            <Coins className="size-4" />
            Nạp Coin
          </Link>
        </Button>
      </div>

      {wallet.isLoading ? (
        <Skeleton className="h-44 rounded-2xl" />
      ) : wallet.isError ? (
        <Alert>{getErrorMessage(wallet.error, 'Không thể tải số dư ví.')}</Alert>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Số dư hiện tại</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {formatAmount(wallet.data?.balance)}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-[#00873E]">
                  <ZenxCoinGoldIcon className="size-4" /> ZENX Coin
                </span>
              </div>
            </div>
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#E8F7EC] text-[#00873E]">
              <WalletCards className="size-7" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Giao dịch gần đây</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Các thay đổi số dư mới nhất của bạn.
            </p>
          </div>
          <Button asChild variant="zenx-outline" size="sm" className="text-xs font-semibold">
            <Link href="/wallet/transactions">
              Xem tất cả <ArrowRight className="ml-1.5 size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-6">
          {transactions.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          ) : transactions.isError ? (
            <Alert>{getErrorMessage(transactions.error, 'Không thể tải lịch sử giao dịch.')}</Alert>
          ) : transactions.data?.items.length ? (
            <div className="divide-y divide-slate-100">
              {transactions.data.items.slice(0, 5).map((transaction) => {
                const isPositive = isPositiveTransaction(transaction.type);
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
                          isPositive
                            ? 'bg-[#E8F7EC] text-[#00873E]'
                            : 'bg-red-50 text-red-500'
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
                          {formatDate(transaction.createdAt)}
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
            <p className="py-10 text-center text-xs text-slate-400">Chưa có giao dịch nào.</p>
          )}
        </div>
      </div>
    </div>
  );
}
