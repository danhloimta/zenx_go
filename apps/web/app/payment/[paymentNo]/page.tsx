"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, XCircle } from "lucide-react";
import { usePayment } from "@/hooks/use-payment";
import { formatAmount, formatDate } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentDetailPage() {
  const params = useParams<{ paymentNo: string }>();
  const paymentNo = decodeURIComponent(params.paymentNo);
  const payment = usePayment(paymentNo);

  if (payment.isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (payment.isError || !payment.data) return <Alert>{getErrorMessage(payment.error, "Không thể tải payment.")}</Alert>;

  const item = payment.data;
  const isSuccess = item.status === "SUCCESS";
  const isFailed = ["FAILED", "EXPIRED", "CANCELLED", "REFUNDED"].includes(item.status);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm"><Link href="/payment"><ArrowLeft className="mr-2 size-4" /> Quay lại nạp Coin</Link></Button>
      <Card>
        <CardHeader className="items-center text-center">
          <StatusIcon success={isSuccess} failed={isFailed} />
          <CardTitle className="mt-3">{isSuccess ? "Nạp Coin thành công" : isFailed ? "Payment chưa hoàn tất" : "Đang xử lý payment"}</CardTitle>
          <CardDescription>{item.paymentNo}{!isSuccess && !isFailed ? " · Tự động kiểm tra mỗi 5 giây" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl bg-muted/60 p-5 text-center">
            <p className="text-sm text-muted-foreground">Số Coin</p>
            <p className="mt-1 text-3xl font-semibold text-primary">{formatAmount(item.coinAmount)} ZENX</p>
            <p className="mt-2 text-sm text-muted-foreground">{formatAmount(item.amountVnd)} VND</p>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Trạng thái" value={<Badge variant={isSuccess ? "success" : isFailed ? "destructive" : "warning"}>{item.status}</Badge>} />
            <Detail label="Phương thức" value={item.paymentMethod ?? "—"} />
            <Detail label="Tạo lúc" value={formatDate(item.createdAt)} />
            <Detail label="Thanh toán lúc" value={formatDate(item.paidAt)} />
            <Detail label="Hết hạn lúc" value={formatDate(item.expiredAt)} />
          </dl>
          {item.paymentUrl && !isSuccess && !isFailed ? <Button asChild className="w-full"><a href={item.paymentUrl} target="_blank" rel="noreferrer">Mở cổng thanh toán <ExternalLink className="ml-2 size-4" /></a></Button> : null}
          <p className="text-center text-xs text-muted-foreground">ZENX Coin chỉ được cộng sau khi hệ thống xác minh callback từ payment provider.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusIcon({ success, failed }: { success: boolean; failed: boolean }) {
  if (success) return <CheckCircle2 className="size-12 text-emerald-600" />;
  if (failed) return <XCircle className="size-12 text-red-600" />;
  return <Clock3 className="size-12 text-amber-600" />;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
