"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const registerSchema = z
  .object({
    username: z.string().trim().min(3, "Username cần ít nhất 3 ký tự."),
    email: z.string().trim().email("Email chưa đúng định dạng."),
    phone: z.string().trim().min(8, "Vui lòng nhập số điện thoại."),
    password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự."),
    fullName: z.string().trim().min(2, "Vui lòng nhập họ tên."),
    otpCode: z.string().trim().length(6, "Mã OTP gồm 6 chữ số."),
    dateOfBirth: z.string().min(1, "Vui lòng chọn ngày sinh."),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"]),
    city: z.string().trim().min(2, "Vui lòng nhập tỉnh/thành phố."),
    acceptTerms: z.boolean().refine(Boolean, "Bạn cần đồng ý Điều khoản sử dụng."),
    acceptPrivacy: z.boolean().refine(Boolean, "Bạn cần đồng ý Chính sách bảo mật."),
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      password: "",
      fullName: "",
      otpCode: "",
      dateOfBirth: "",
      gender: "UNSPECIFIED",
      city: "",
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });
  const sendOtp = useMutation({
    mutationFn: () =>
      api.otp.send({
        channel: "SMS",
        purpose: "VERIFY_PHONE",
        destination: form.getValues("phone"),
      }),
    onSuccess: (result) => toast.success(`Đã gửi OTP. Mã có hiệu lực trong ${Math.round(result.expiresIn / 60)} phút.`),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const register = useMutation({
    mutationFn: async ({ otpCode, ...values }: RegisterValues) => {
      const verification = await api.otp.verify({
        channel: "SMS",
        purpose: "VERIFY_PHONE",
        destination: values.phone,
        code: otpCode,
      });
      return api.auth.register({ ...values, verificationToken: verification.verificationToken });
    },
    onSuccess: () => {
      toast.success("Tạo tài khoản thành công.");
      router.push("/account");
      router.refresh();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const phone = form.watch("phone");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tạo tài khoản ZENX GO</CardTitle>
        <CardDescription>Hoàn tất thông tin và xác thực số điện thoại bằng OTP.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit((values) => register.mutate(values))}>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Username" htmlFor="username" error={form.formState.errors.username?.message}>
              <Input id="username" autoComplete="username" placeholder="player01" {...form.register("username")} />
            </FormField>
            <FormField label="Họ và tên" htmlFor="fullName" error={form.formState.errors.fullName?.message}>
              <Input id="fullName" autoComplete="name" placeholder="Player One" {...form.register("fullName")} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" placeholder="player@example.com" {...form.register("email")} />
            </FormField>
            <FormField label="Số điện thoại" htmlFor="phone" error={form.formState.errors.phone?.message}>
              <Input id="phone" type="tel" autoComplete="tel" placeholder="+84901234567" {...form.register("phone")} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Mật khẩu" htmlFor="password" error={form.formState.errors.password?.message}>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            </FormField>
            <FormField label="Ngày sinh" htmlFor="dateOfBirth" error={form.formState.errors.dateOfBirth?.message}>
              <Input id="dateOfBirth" type="date" {...form.register("dateOfBirth")} />
            </FormField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Giới tính" htmlFor="gender" error={form.formState.errors.gender?.message}>
              <Select id="gender" {...form.register("gender")}>
                <option value="UNSPECIFIED">Chưa xác định</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </Select>
            </FormField>
            <FormField label="Tỉnh/Thành phố" htmlFor="city" error={form.formState.errors.city?.message}>
              <Input id="city" placeholder="Ho Chi Minh City" {...form.register("city")} />
            </FormField>
          </div>
          <FormField label="Mã OTP" htmlFor="otpCode" error={form.formState.errors.otpCode?.message} hint="Mặc định gửi qua SMS trong foundation.">
            <div className="flex gap-2">
              <Input id="otpCode" inputMode="numeric" maxLength={6} placeholder="123456" {...form.register("otpCode")} />
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => sendOtp.mutate()}
                disabled={!phone || sendOtp.isPending}
              >
                {sendOtp.isPending ? "Đang gửi…" : "Gửi OTP"}
              </Button>
            </div>
          </FormField>

          <div className="space-y-3 rounded-xl bg-muted/60 p-4">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox className="mt-0.5" {...form.register("acceptTerms")} />
              <span>Tôi đồng ý với Điều khoản sử dụng của ZENX GO.</span>
            </label>
            {form.formState.errors.acceptTerms?.message ? <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p> : null}
            <label className="flex items-start gap-3 text-sm">
              <Checkbox className="mt-0.5" {...form.register("acceptPrivacy")} />
              <span>Tôi đồng ý với Chính sách bảo mật của ZENX GO.</span>
            </label>
            {form.formState.errors.acceptPrivacy?.message ? <p className="text-xs text-destructive">{form.formState.errors.acceptPrivacy.message}</p> : null}
          </div>

          <Button className="w-full" type="submit" disabled={register.isPending}>
            {register.isPending ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Đã có tài khoản? <Link className="font-medium text-primary hover:underline" href="/auth/login">Đăng nhập</Link>
        </p>
      </CardContent>
    </Card>
  );
}
