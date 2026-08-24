"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Clock3, Coins } from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { formatAmount, formatDate } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const paymentSchema = z.object({
  coinPackageId: z.string().min(1, "Vui lòng chọn gói Coin."),
  paymentMethod: z.enum(["QR", "REDIRECT"]),
});
type PaymentValues = z.infer<typeof paymentSchema>;

export default function PaymentPage() {
  const router = useRouter();
  const packages = useQuery({ queryKey: ["coin-packages"], queryFn: api.coinPackages.list, retry: false });
  const payments = useQuery({ queryKey: ["payments"], queryFn: api.payments.list, retry: false });
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { coinPackageId: "", paymentMethod: "QR" },
  });
  const createPayment = useMutation({
    mutationFn: api.payments.create,
    onSuccess: (payment) => {
      toast.success("Đã tạo payment.");
      router.push(`/payment/${encodeURIComponent(payment.paymentNo)}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Payment</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Nạp ZENX Coin</h1>
        <p className="mt-2 text-muted-foreground">Chọn gói Coin và phương thức thanh toán phù hợp.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Chọn gói Coin</CardTitle>
            <CardDescription>Coin chỉ được cộng sau khi backend xác minh payment callback thành công.</CardDescription>
          </CardHeader>
          <CardContent>
            {packages.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
            ) : packages.isError ? (
              <Alert>{getErrorMessage(packages.error, "Không thể tải danh sách gói Coin.")}</Alert>
            ) : packages.data?.length ? (
              <form className="space-y-6" onSubmit={form.handleSubmit((values) => createPayment.mutate(values))}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {packages.data.map((item) => (
                    <label key={item.id} className="relative cursor-pointer rounded-xl border p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                      <input type="radio" value={item.id} className="sr-only" {...form.register("coinPackageId")} />
                      <span className="block font-semibold">{item.name}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{formatAmount(item.coinAmount)} ZENX</span>
                      <span className="mt-3 block text-lg font-semibold text-primary">{formatAmount(item.priceVnd)} VND</span>
                    </label>
                  ))}
                </div>
                {form.formState.errors.coinPackageId?.message ? <p className="text-xs text-destructive">{form.formState.errors.coinPackageId.message}</p> : null}
                <FormField label="Phương thức thanh toán" htmlFor="payment-method" error={form.formState.errors.paymentMethod?.message}>
                  <Select id="payment-method" {...form.register("paymentMethod")}>
                    <option value="QR">QR Code</option>
                    <option value="REDIRECT">Redirect đến cổng thanh toán</option>
                  </Select>
                </FormField>
                <Button type="submit" disabled={createPayment.isPending}>
                  {createPayment.isPending ? "Đang tạo payment…" : "Tiếp tục thanh toán"}<ArrowRight className="ml-2 size-4" />
                </Button>
              </form>
            ) : (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Chưa có gói Coin khả dụng.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quy trình nạp</CardTitle>
            <CardDescription>Trạng thái sẽ được cập nhật qua callback từ provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Step icon={<Coins className="size-4" />} title="Chọn gói" description="Chọn số Coin muốn nạp." />
            <Step icon={<Clock3 className="size-4" />} title="Đang xử lý" description="Hoàn tất thanh toán tại provider." />
            <Step icon={<CheckCircle2 className="size-4" />} title="Cộng Coin" description="Backend verify callback và cập nhật ledger." />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử nạp</CardTitle>
          <CardDescription>Các payment gần đây của tài khoản.</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.isLoading ? <Skeleton className="h-20" /> : payments.isError ? <Alert>{getErrorMessage(payments.error, "Không thể tải lịch sử payment.")}</Alert> : payments.data?.length ? (
            <div className="divide-y">
              {payments.data.map((payment) => (
                <Link key={payment.paymentNo} href={`/payment/${encodeURIComponent(payment.paymentNo)}`} className="flex items-center justify-between gap-4 py-4 hover:bg-muted/40">
                  <span>
                    <span className="block font-medium">{formatAmount(payment.coinAmount)} ZENX Coin</span>
                    <span className="block text-xs text-muted-foreground">{payment.paymentNo} · {formatDate(payment.createdAt)}</span>
                  </span>
                  <span className="text-right"><Badge variant={payment.status === "SUCCESS" ? "success" : payment.status === "FAILED" ? "destructive" : "warning"}>{payment.status}</Badge><span className="mt-1 block text-sm font-medium">{formatAmount(payment.amountVnd)} VND</span></span>
                </Link>
              ))}
            </div>
          ) : <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Chưa có payment nào.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span><span><span className="block font-medium">{title}</span><span className="block text-sm text-muted-foreground">{description}</span></span></div>;
}
