"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useAccount } from "@/hooks/use-account";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Vui lòng nhập họ tên."),
  avatarUrl: z.string().url("Avatar cần là URL hợp lệ.").or(z.literal("")),
  dateOfBirth: z.string(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"]),
  city: z.string().trim().min(2, "Vui lòng nhập tỉnh/thành phố."),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8, "Mật khẩu mới cần ít nhất 8 ký tự."),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Mật khẩu nhập lại chưa khớp.",
  });
type PasswordValues = z.infer<typeof passwordSchema>;

const contactSchema = z.object({
  value: z.string().trim().min(1, "Vui lòng nhập giá trị mới."),
  otpCode: z.string().trim().length(6, "Mã OTP gồm 6 chữ số."),
});
type ContactValues = z.infer<typeof contactSchema>;

export default function AccountPage() {
  const account = useAccount();

  if (account.isLoading) return <AccountLoading />;
  if (account.isError || !account.data) {
    return (
      <Alert>
        Không thể tải tài khoản. Vui lòng <Link className="font-medium underline" href="/auth/login">đăng nhập lại</Link>.
      </Alert>
    );
  }

  return <AccountContent account={account.data} />;
}

function AccountContent({ account }: { account: NonNullable<ReturnType<typeof useAccount>["data"]> }) {
  const queryClient = useQueryClient();
  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: account.profile.fullName ?? "",
      avatarUrl: account.profile.avatarUrl ?? "",
      dateOfBirth: account.profile.dateOfBirth ?? "",
      gender: account.profile.gender ?? "UNSPECIFIED",
      city: account.profile.city ?? "",
    },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const emailForm = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: { value: "", otpCode: "" } });
  const phoneForm = useForm<ContactValues>({ resolver: zodResolver(contactSchema), defaultValues: { value: "", otpCode: "" } });

  useEffect(() => {
    profileForm.reset({
      fullName: account.profile.fullName ?? "",
      avatarUrl: account.profile.avatarUrl ?? "",
      dateOfBirth: account.profile.dateOfBirth ?? "",
      gender: account.profile.gender ?? "UNSPECIFIED",
      city: account.profile.city ?? "",
    });
  }, [account, profileForm]);

  const updateProfile = useMutation({
    mutationFn: api.account.update,
    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ.");
      void queryClient.invalidateQueries({ queryKey: ["account", "me"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const changePassword = useMutation({
    mutationFn: ({ confirmPassword: _confirmPassword, ...values }: PasswordValues) => api.account.changePassword(values),
    onSuccess: () => {
      toast.success("Đã đổi mật khẩu.");
      passwordForm.reset();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const changeEmail = useMutation({
    mutationFn: async (values: ContactValues) => {
      const verification = await api.otp.verify({ channel: "EMAIL", purpose: "CHANGE_EMAIL", destination: values.value, code: values.otpCode });
      return api.account.changeEmail({ newEmail: values.value, verificationToken: verification.verificationToken });
    },
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu đổi email.");
      emailForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["account", "me"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const changePhone = useMutation({
    mutationFn: async (values: ContactValues) => {
      const verification = await api.otp.verify({ channel: "SMS", purpose: "CHANGE_PHONE", destination: values.value, code: values.otpCode });
      return api.account.changePhone({ newPhone: values.value, verificationToken: verification.verificationToken });
    },
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu đổi số điện thoại.");
      phoneForm.reset();
      void queryClient.invalidateQueries({ queryKey: ["account", "me"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const unlink = useMutation({
    mutationFn: api.social.unlink,
    onSuccess: () => {
      toast.success("Đã hủy liên kết.");
      void queryClient.invalidateQueries({ queryKey: ["account", "me"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const sendContactOtp = useMutation({
    mutationFn: (input: { channel: "EMAIL" | "SMS"; purpose: "CHANGE_EMAIL" | "CHANGE_PHONE"; destination: string }) => api.otp.send(input),
    onSuccess: (result) => toast.success(`Đã gửi OTP. Mã có hiệu lực trong ${Math.round(result.expiresIn / 60)} phút.`),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Tài khoản</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Xin chào, {account.profile.fullName || account.username}</h1>
        <p className="mt-2 text-muted-foreground">Quản lý thông tin và phương thức đăng nhập của bạn.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật thông tin hiển thị của tài khoản.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}>
              <div className="sm:col-span-2">
                <FormField label="Username" htmlFor="account-username" hint="Username là định danh đăng nhập và không đổi trong form này.">
                  <Input id="account-username" value={account.username} disabled />
                </FormField>
              </div>
              <FormField label="Họ và tên" htmlFor="account-fullName" error={profileForm.formState.errors.fullName?.message}>
                <Input id="account-fullName" {...profileForm.register("fullName")} />
              </FormField>
              <FormField label="Ngày sinh" htmlFor="account-dateOfBirth" error={profileForm.formState.errors.dateOfBirth?.message}>
                <Input id="account-dateOfBirth" type="date" {...profileForm.register("dateOfBirth")} />
              </FormField>
              <FormField label="Giới tính" htmlFor="account-gender" error={profileForm.formState.errors.gender?.message}>
                <Select id="account-gender" {...profileForm.register("gender")}>
                  <option value="UNSPECIFIED">Chưa xác định</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </Select>
              </FormField>
              <FormField label="Tỉnh/Thành phố" htmlFor="account-city" error={profileForm.formState.errors.city?.message}>
                <Input id="account-city" {...profileForm.register("city")} />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Avatar URL" htmlFor="account-avatarUrl" error={profileForm.formState.errors.avatarUrl?.message}>
                  <Input id="account-avatarUrl" placeholder="https://…" {...profileForm.register("avatarUrl")} />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Đang lưu…" : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin đăng nhập</CardTitle>
            <CardDescription>Thông tin liên hệ và trạng thái xác thực.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <InfoRow label="Email" value={account.email ?? "Chưa cập nhật"} />
            <InfoRow label="Số điện thoại" value={account.phone ?? "Chưa cập nhật"} />
            <InfoRow label="Trạng thái" value={<Badge variant={account.status === "ACTIVE" ? "success" : "warning"}>{account.status ?? "PENDING"}</Badge>} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>Tài khoản social-only có thể để trống mật khẩu hiện tại khi thiết lập lần đầu.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={passwordForm.handleSubmit((values) => changePassword.mutate(values))}>
              <FormField label="Mật khẩu hiện tại" htmlFor="currentPassword" error={passwordForm.formState.errors.currentPassword?.message}>
                <Input id="currentPassword" type="password" autoComplete="current-password" {...passwordForm.register("currentPassword")} />
              </FormField>
              <FormField label="Mật khẩu mới" htmlFor="newPassword" error={passwordForm.formState.errors.newPassword?.message}>
                <Input id="newPassword" type="password" autoComplete="new-password" {...passwordForm.register("newPassword")} />
              </FormField>
              <FormField label="Nhập lại mật khẩu mới" htmlFor="confirmPassword" error={passwordForm.formState.errors.confirmPassword?.message}>
                <Input id="confirmPassword" type="password" autoComplete="new-password" {...passwordForm.register("confirmPassword")} />
              </FormField>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? "Đang cập nhật…" : "Đổi mật khẩu"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liên kết social</CardTitle>
            <CardDescription>Không tự động liên kết chỉ vì email social trùng tài khoản.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SocialRow
              name="Google"
              linked={account.social.google}
              onUnlink={() => unlink.mutate("google")}
              unlinking={unlink.isPending && unlink.variables === "google"}
            />
            <SocialRow
              name="Facebook"
              linked={account.social.facebook}
              onUnlink={() => unlink.mutate("facebook")}
              unlinking={unlink.isPending && unlink.variables === "facebook"}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ContactCard
          title="Đổi email"
          description="Nhập email mới và mã OTP xác nhận email."
          label="Email mới"
          inputType="email"
          form={emailForm}
          onSubmit={(values) => changeEmail.mutate(values)}
          onSend={(value) => sendContactOtp.mutate({ channel: "EMAIL", purpose: "CHANGE_EMAIL", destination: value })}
          pending={changeEmail.isPending}
        />
        <ContactCard
          title="Đổi số điện thoại"
          description="Nhập số điện thoại mới và mã OTP xác nhận."
          label="Số điện thoại mới"
          inputType="tel"
          form={phoneForm}
          onSubmit={(values) => changePhone.mutate(values)}
          onSend={(value) => sendContactOtp.mutate({ channel: "SMS", purpose: "CHANGE_PHONE", destination: value })}
          pending={changePhone.isPending}
        />
      </div>
    </div>
  );
}

function AccountLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-72" />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Skeleton className="h-[420px]" />
        <Skeleton className="h-[220px]" />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function SocialRow({ name, linked, onUnlink, unlinking }: { name: string; linked: boolean; onUnlink: () => void; unlinking: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{linked ? "Đã liên kết" : "Chưa liên kết"}</p>
      </div>
      {linked ? (
        <Button variant="outline" size="sm" onClick={onUnlink} disabled={unlinking}>{unlinking ? "Đang hủy…" : "Hủy liên kết"}</Button>
      ) : (
        <Button asChild variant="outline" size="sm"><a href={api.auth.oauthUrl(name.toLowerCase() as "google" | "facebook", "link")}>Liên kết</a></Button>
      )}
    </div>
  );
}

function ContactCard({
  title,
  description,
  label,
  inputType,
  form,
  onSubmit,
  onSend,
  pending,
}: {
  title: string;
  description: string;
  label: string;
  inputType: "email" | "tel";
  form: ReturnType<typeof useForm<ContactValues>>;
  onSubmit: (values: ContactValues) => void;
  onSend: (value: string) => void;
  pending: boolean;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label={label} htmlFor={`${inputType}-value`} error={form.formState.errors.value?.message}>
            <div className="flex gap-2">
              <Input id={`${inputType}-value`} type={inputType} {...form.register("value")} />
              <Button type="button" variant="outline" className="shrink-0" onClick={() => onSend(form.getValues("value"))} disabled={!form.getValues("value")}>
                Gửi OTP
              </Button>
            </div>
          </FormField>
          <FormField label="Mã OTP" htmlFor={`${inputType}-otp`} error={form.formState.errors.otpCode?.message}>
            <Input id={`${inputType}-otp`} inputMode="numeric" maxLength={6} {...form.register("otpCode")} />
          </FormField>
          <Button type="submit" variant="outline" disabled={pending}>{pending ? "Đang gửi…" : "Xác nhận thay đổi"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
