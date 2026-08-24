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

const loginSchema = z.object({
  username: z.string().trim().min(1, "Vui lòng nhập username."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });
  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: () => {
      toast.success("Đăng nhập thành công.");
      router.push("/account");
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Username hoặc mật khẩu không đúng.")),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chào mừng trở lại</CardTitle>
        <CardDescription>Đăng nhập để quản lý tài khoản và ví ZENX Coin.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
          <FormField label="Username" htmlFor="username" error={form.formState.errors.username?.message}>
            <Input id="username" autoComplete="username" placeholder="player01" {...form.register("username")} />
          </FormField>
          <FormField label="Mật khẩu" htmlFor="password" error={form.formState.errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
          </FormField>
          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> hoặc tiếp tục với <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild variant="outline">
            <a href={api.auth.oauthUrl("google")}>Google</a>
          </Button>
          <Button asChild variant="outline">
            <a href={api.auth.oauthUrl("facebook")}>Facebook</a>
          </Button>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link className="text-primary hover:underline" href="/auth/forgot-password">
            Quên mật khẩu?
          </Link>
          <Link className="font-medium text-primary hover:underline" href="/auth/register">
            Tạo tài khoản
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
