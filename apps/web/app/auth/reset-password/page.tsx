"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    email: z.string().trim().email("Email chưa đúng định dạng."),
    code: z.string().trim().length(6, "Mã gồm 6 chữ số."),
    newPassword: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại chưa khớp.",
  });

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", code: "", newPassword: "", confirmPassword: "" },
  });
  const mutation = useMutation({
    mutationFn: async ({ confirmPassword: _confirmPassword, code, email, newPassword }: Values) => {
      const verification = await api.otp.verify({ channel: "EMAIL", purpose: "RESET_PASSWORD", destination: email, code });
      return api.auth.resetPassword({ email, verificationToken: verification.verificationToken, newPassword });
    },
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công.");
      router.push("/auth/login");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đặt lại mật khẩu</CardTitle>
        <CardDescription>Dùng mã 6 chữ số đã nhận qua email để tạo mật khẩu mới.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
          </FormField>
          <FormField label="Mã xác thực" htmlFor="code" error={form.formState.errors.code?.message}>
            <Input id="code" inputMode="numeric" maxLength={6} {...form.register("code")} />
          </FormField>
          <FormField label="Mật khẩu mới" htmlFor="newPassword" error={form.formState.errors.newPassword?.message}>
            <Input id="newPassword" type="password" autoComplete="new-password" {...form.register("newPassword")} />
          </FormField>
          <FormField label="Nhập lại mật khẩu" htmlFor="confirmPassword" error={form.formState.errors.confirmPassword?.message}>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
          </FormField>
          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" href="/auth/login">Quay lại đăng nhập</Link>
        </p>
      </CardContent>
    </Card>
  );
}
