"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, XCircle } from "lucide-react";
import { usePayment } from "@/hooks/use-payment";
import { api } from "@/lib/api";
import { formatAmount, formatDate, paymentMethodLabel } from "@/lib/utils";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentDetailPage() {
  const params = useParams<{ paymentNo: string }>();
  const paymentNo = decodeURIComponent(params.paymentNo);
  const payment = usePayment(paymentNo);
  const queryClient = useQueryClient();
  const complete = useMutation({ mutationFn: () => api.payments.mockComplete(paymentNo), onSuccess: () => { toast.success("Đã xác nhận thanh toán giả lập."); void queryClient.invalidateQueries({ queryKey: ["payment", paymentNo] }); void queryClient.invalidateQueries({ queryKey: ["wallet"] }); }, onError: (error) => toast.error(getErrorMessage(error)) });

  if (payment.isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (payment.isError || !payment.data) return <Alert>{getErrorMessage(payment.error, "Không thể tải payment.")}</Alert>;

  const item = payment.data;
  const isSuccess = item.status === "SUCCESS";
  const isExpired = item.status === "EXPIRED";
  const isFailed = ["FAILED", "EXPIRED", "CANCELLED", "REFUNDED"].includes(item.status);
  const isMock = item.provider === "mock";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm"><Link href="/payment"><ArrowLeft className="mr-2 size-4" /> Quay lại nạp Coin</Link></Button>
      <Card>
        <CardHeader className="items-center text-center">
          <StatusIcon success={isSuccess} failed={isFailed} />
          <CardTitle className="mt-3">{isSuccess ? "Nạp Coin thành công" : isExpired ? "Payment đã hết hạn" : isFailed ? "Payment chưa hoàn tất" : "Đang xử lý payment"}</CardTitle>
          <CardDescription>{item.paymentNo}{!isSuccess && !isFailed ? " · Tự động kiểm tra mỗi 5 giây" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl bg-muted/60 p-5 text-center">
            <p className="text-sm text-muted-foreground">Số Coin</p>
            <p className="mt-1 text-3xl font-semibold text-primary">{formatAmount(item.coinAmount)} ZENX</p>
            <p className="mt-2 text-sm text-muted-foreground">{formatAmount(item.amountVnd)} VND</p>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Detail label="Trạng thái" value={<StatusBadge status={item.status} />} />
            <Detail label="Phương thức" value={paymentMethodLabel(item.paymentMethod)} />
            <Detail label="Tạo lúc" value={formatDate(item.createdAt)} />
            <Detail label="Thanh toán lúc" value={formatDate(item.paidAt)} />
            <Detail label="Hết hạn lúc" value={formatDate(item.expiredAt)} />
          </dl>
          {item.qrPayload && !isSuccess && !isFailed ? <MockQrDetails payload={item.qrPayload} /> : null}
          {!isSuccess && !isFailed ? <div className="grid gap-3 sm:grid-cols-2">
            {item.paymentUrl ? <Button asChild variant="outline"><a href={item.paymentUrl} target="_blank" rel="noreferrer">Mở cổng thanh toán <ExternalLink className="ml-2 size-4" /></a></Button> : null}
            {isMock ? <Button onClick={() => complete.mutate()} disabled={complete.isPending}>{complete.isPending ? "Đang xác nhận…" : "Hoàn tất thanh toán mẫu"}</Button> : null}
          </div> : null}
          {isMock ? <p className="text-center text-xs text-amber-700">Đây là payment mô phỏng dành cho môi trường demo.</p> : null}
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

function MockQrDetails({ payload }: { payload: string }) {
  const details = parseMockQrPayload(payload);
  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="text-sm font-medium text-center">Thông tin thanh toán mô phỏng</p>
      {details ? (
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <Detail label="Mã payment" value={details.paymentNo ?? '—'} />
          <Detail label="Phương thức" value={paymentMethodLabel(details.method)} />
          <Detail label="Số tiền" value={`${formatAmount(details.amountVnd)} VND`} />
          <Detail label="Số Coin" value={`${formatAmount(details.coinAmount)} ZENX`} />
        </dl>
      ) : (
        <p className="mt-2 break-all text-center text-xs text-slate-500">Mã tham chiếu: {payload}</p>
      )}
    </div>
  );
}

function parseMockQrPayload(payload: string) {
  try {
    const value = JSON.parse(payload) as Record<string, unknown>;
    return {
      paymentNo: typeof value.paymentNo === 'string' ? value.paymentNo : undefined,
      amountVnd: typeof value.amountVnd === 'string' || typeof value.amountVnd === 'number' ? value.amountVnd : undefined,
      coinAmount: typeof value.coinAmount === 'string' || typeof value.coinAmount === 'number' ? value.coinAmount : undefined,
      method: typeof value.method === 'string' ? value.method : undefined,
    };
  } catch {
    return null;
  }
}
