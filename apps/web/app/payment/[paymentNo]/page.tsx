"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Clock3, Copy, XCircle } from "lucide-react";
import { usePayment } from "@/hooks/use-payment";
import { api } from "@/lib/api";
import { formatAmount, formatDate, getBankName, paymentMethodLabel } from "@/lib/utils";
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
  const paymentConfig = useQuery({ queryKey: ["payment-config"], queryFn: api.payments.config, retry: false });
  const complete = useMutation({ mutationFn: () => api.payments.mockComplete(paymentNo), onSuccess: () => { toast.success("Đã xác nhận thanh toán giả lập."); void queryClient.invalidateQueries({ queryKey: ["payment", paymentNo] }); void queryClient.invalidateQueries({ queryKey: ["wallet"] }); }, onError: (error) => toast.error(getErrorMessage(error)) });

  useEffect(() => {
    if (payment.data?.status === "SUCCESS") void queryClient.invalidateQueries({ queryKey: ["wallet"] });
  }, [payment.data?.status, queryClient]);

  if (payment.isLoading) return <Skeleton className="mx-auto h-96 max-w-2xl" />;
  if (payment.isError || !payment.data) return <Alert>{getErrorMessage(payment.error, "Không thể tải payment.")}</Alert>;

  const item = payment.data;
  const isSuccess = item.status === "SUCCESS";
  const isExpired = item.status === "EXPIRED";
  const isFailed = ["FAILED", "EXPIRED", "CANCELLED", "REFUNDED"].includes(item.status);
  const isMock = item.provider === "mock";
  const canCompleteMock = isMock && paymentConfig.data?.allowMockCompletion === true;

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
          {item.qrImageUrl && !isSuccess && !isFailed ? <SepayQrDetails payment={item} /> : null}
          {!item.qrImageUrl && item.qrPayload && !isSuccess && !isFailed ? <MockQrDetails payload={item.qrPayload} /> : null}
          {!isSuccess && !isFailed ? <div className="grid gap-3 sm:grid-cols-2">
            {canCompleteMock ? <Button onClick={() => complete.mutate()} disabled={complete.isPending}>{complete.isPending ? "Đang xác nhận…" : "Hoàn tất thanh toán mẫu"}</Button> : null}
          </div> : null}
          {canCompleteMock ? <p className="text-center text-xs text-amber-700">Đây là payment mô phỏng dành cho môi trường kiểm thử.</p> : null}
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

function SepayQrDetails({ payment }: { payment: NonNullable<ReturnType<typeof usePayment>["data"]> }) {
  const bankAccount = payment.bankTransfer?.bankAccount ?? "—";
  const bankCode = payment.bankTransfer?.bankCode ?? "—";
  const accountHolder = payment.bankTransfer?.accountHolder ?? "—";
  const bankName = getBankName(bankCode);

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`Đã sao chép ${label}.`);
    } catch {
      toast.error(`Không thể sao chép ${label}.`);
    }
  };

  return (
    <div className="rounded-xl border bg-slate-50 p-4">
      <p className="text-center text-sm font-semibold">Quét QR để chuyển khoản</p>
      <img src={payment.qrImageUrl ?? undefined} alt="Mã QR thanh toán VietQR" className="mx-auto mt-4 size-64 rounded-lg bg-white object-contain p-2" />
      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <CopyDetail label="Ngân hàng" value={bankName} onCopy={() => copyValue(bankName, "tên ngân hàng")} />
        <CopyDetail label="Chủ tài khoản" value={accountHolder} onCopy={() => copyValue(accountHolder, "tên chủ tài khoản")} />
        <CopyDetail label="Số tài khoản" value={bankAccount} onCopy={() => copyValue(bankAccount, "số tài khoản")} />
        <CopyDetail label="Nội dung chuyển khoản" value={payment.paymentNo} onCopy={() => copyValue(payment.paymentNo, "nội dung chuyển khoản")} />
      </dl>
      <p className="mt-4 text-center text-xs text-slate-500">Vui lòng chuyển đúng số tiền và giữ nguyên nội dung chuyển khoản để hệ thống tự động cộng Coin.</p>
    </div>
  );
}

function CopyDetail({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex items-center gap-1 font-medium">
        <span className="break-all">{value}</span>
        {onCopy ? <button type="button" aria-label={`Sao chép ${label.toLowerCase()}`} onClick={onCopy} className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-900"><Copy className="size-3.5" /></button> : null}
      </dd>
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
