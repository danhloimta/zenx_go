"use client";

import Link from "next/link";
import { useState } from "react";
import type { WalletTransactionStatus, WalletTransactionType } from "@zenx-go/api-client";
import { ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";
import { useWallet, useWalletTransactions } from "@/hooks/use-wallet";
import { formatAmount, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function WalletPage() {
  const [type, setType] = useState<WalletTransactionType | "ALL">("ALL");
  const [status, setStatus] = useState<WalletTransactionStatus | "ALL">("ALL");
  const wallet = useWallet();
  const transactions = useWalletTransactions({ type, status });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Wallet</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ví ZENX Coin</h1>
          <p className="mt-2 text-muted-foreground">Theo dõi số dư và toàn bộ ledger giao dịch.</p>
        </div>
        <LinkButton href="/payment" size="lg"><Coins className="mr-2 size-4" /> Nạp Coin</LinkButton>
      </div>

      {wallet.isLoading ? (
        <Skeleton className="h-44" />
      ) : wallet.isError ? (
        <Alert>{getErrorMessage(wallet.error, "Không thể tải số dư ví.")}</Alert>
      ) : (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-soft">
          <CardContent className="flex flex-col justify-between gap-8 p-7 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-blue-100">Số dư hiện tại</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{formatAmount(wallet.data?.balance ?? 0)}</p>
              <p className="mt-2 text-sm text-blue-100">{wallet.data?.currency ?? "ZENX"} Coin</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <Coins className="size-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Lịch sử giao dịch</CardTitle>
            <CardDescription>Mỗi thay đổi số dư đều được ghi nhận trong ledger.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select aria-label="Lọc theo loại" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="w-auto min-w-32">
              <option value="ALL">Tất cả loại</option>
              <option value="TOPUP">Nạp</option>
              <option value="CREDIT">Cộng</option>
              <option value="DEBIT">Trừ</option>
              <option value="REFUND">Hoàn</option>
            </Select>
            <Select aria-label="Lọc theo trạng thái" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="w-auto min-w-32">
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUCCESS">Thành công</option>
              <option value="PENDING">Đang xử lý</option>
              <option value="FAILED">Thất bại</option>
              <option value="REVERSED">Đã đảo</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.isLoading ? (
            <div className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
          ) : transactions.isError ? (
            <Alert>{getErrorMessage(transactions.error, "Không thể tải lịch sử giao dịch.")}</Alert>
          ) : transactions.data?.items.length ? (
            <div className="divide-y">
              {transactions.data.items.map((transaction) => {
                const positive = transaction.type === "TOPUP" || transaction.type === "CREDIT" || transaction.type === "REFUND";
                return (
                  <Link key={transaction.transactionNo} href={`/wallet/transactions/${encodeURIComponent(transaction.transactionNo)}`} className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-muted/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {positive ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{transaction.description || transaction.type}</span>
                        <span className="block text-xs text-muted-foreground">{transaction.transactionNo} · {formatDate(transaction.createdAt)}</span>
                      </span>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className={`block font-semibold ${positive ? "text-emerald-700" : "text-red-700"}`}>{positive ? "+" : "−"}{formatAmount(transaction.amount)}</span>
                      <Badge variant={transaction.status === "SUCCESS" ? "success" : transaction.status === "FAILED" ? "destructive" : "warning"}>{transaction.status}</Badge>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Chưa có giao dịch phù hợp.</div>
          )}
          {transactions.data ? <p className="mt-5 text-xs text-muted-foreground">Hiển thị {transactions.data.items.length} / {transactions.data.total} giao dịch.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
