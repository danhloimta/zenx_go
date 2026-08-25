"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { formatAmount, formatDate, isPositiveTransaction, paymentMethodLabel, transactionTypeLabel } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionDetailPage() {
  const params = useParams<{ transactionNo: string }>();
  const transactionNo = decodeURIComponent(params.transactionNo);
  const query = useQuery({
    queryKey: ["wallet", "transaction", transactionNo],
    queryFn: () => api.wallet.transaction(transactionNo),
    retry: false,
  });

  if (query.isLoading) return <Skeleton className="h-96" />;
  if (query.isError || !query.data) return <Alert>{getErrorMessage(query.error, "Không thể tải chi tiết giao dịch.")}</Alert>;

  const transaction = query.data;
  const positive = isPositiveTransaction(transaction.type);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm"><Link href="/wallet/transactions"><ArrowLeft className="mr-2 size-4" /> Quay lại lịch sử giao dịch</Link></Button>
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết giao dịch</CardTitle>
          <CardDescription>{transaction.transactionNo}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl bg-muted/60 p-5">
            <span className={`flex size-12 items-center justify-center rounded-full ${positive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {positive ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Số lượng</p>
              <p className={`text-3xl font-semibold ${positive ? "text-emerald-700" : "text-red-700"}`}>{positive ? "+" : "−"}{formatAmount(transaction.amount)} ZENX</p>
            </div>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Loại" value={transactionTypeLabel(transaction.type)} />
            <Detail label="Trạng thái" value={<StatusBadge status={transaction.status} />} />
            <Detail label="Thời gian tạo" value={formatDate(transaction.createdAt)} />
            <Detail label="Hoàn tất lúc" value={formatDate(transaction.completedAt)} />
            <Detail label="Số dư trước" value={formatAmount(transaction.balanceBefore, " ZENX")} />
            <Detail label="Số dư sau" value={formatAmount(transaction.balanceAfter, " ZENX")} />
            <Detail label="Kênh thanh toán" value={paymentMethodLabel(transaction.payment?.paymentMethod)} />
            <Detail label="Mã payment" value={transaction.payment?.paymentNo ?? "—"} />
            <Detail label="Reference" value={transaction.referenceId ? `${transaction.referenceType ?? ""} · ${transaction.referenceId}` : "—"} />
            <Detail label="Mô tả" value={transaction.description || "—"} />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
