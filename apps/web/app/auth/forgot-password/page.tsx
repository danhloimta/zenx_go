"use client";

import Link from "next/link";
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

const schema = z.object({ email: z.string().trim().email("Email chưa đúng định dạng.") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const mutation = useMutation({
    mutationFn: api.auth.forgotPassword,
    onSuccess: () => toast.success("Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi."),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quên mật khẩu</CardTitle>
        <CardDescription>Nhập email đã đăng ký để nhận mã đặt lại mật khẩu.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" placeholder="player@example.com" {...form.register("email")} />
          </FormField>
          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang gửi…" : "Gửi hướng dẫn"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-primary hover:underline" href="/auth/login">Quay lại đăng nhập</Link>
        </p>
      </CardContent>
    </Card>
  );
}
