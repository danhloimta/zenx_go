'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Eye,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  WalletCards,
  X,
  Copy,
  Check,
  User,
  Clock,
  ChevronRight,
  Shield,
  CreditCard,
  Pencil,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUserDetail } from '@zenx-go/api-client';
import { useAdminUser } from '@/hooks/use-admin';
import { useAdminFinanceWalletAdjustment } from '@/hooks/use-finance';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatAmount, formatDate, formatDateOnly, transactionTypeLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { UserAvatar } from '@/components/user-avatar';
import { AccountStatusBadge } from '@/components/account-status-badge';
import { toast } from 'sonner';

type Action = 'password' | 'editIdentity' | 'deleteUser' | null;

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = typeof params.userId === 'string' ? decodeURIComponent(params.userId) : '';
  const query = useAdminUser(userId);
  const user = query.data;
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [reveal, setReveal] = useState<{
    identity: { citizenId: string; issuedAt: string; issuedPlace: string } | null;
  } | null>(null);
  const [editIdentityData, setEditIdentityData] = useState<{
    citizenId: string;
    issuedAt: string;
    issuedPlace: string;
  } | null>(null);
  const [profile, setProfile] = useState<ProfileForm | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfile({
      username: user.username,
      email: user.email,
      phone: user.phone ?? '',
      fullName: user.profile?.fullName ?? '',
      dateOfBirth: user.profile?.dateOfBirth?.slice(0, 10) ?? '',
      gender: user.profile?.gender ?? 'UNSPECIFIED',
      city: user.profile?.city ?? '',
      address: user.profile?.address ?? '',
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
    });
  }, [user]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const profileMutation = useMutation({
    mutationFn: () =>
      api.admin.updateProfile(userId, {
        ...profile!,
        dateOfBirth: profile!.dateOfBirth || null,
        phone: profile!.phone || null,
        city: profile!.city || null,
        address: profile!.address || null,
        gender: profile!.gender as 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED',
        expectedUpdatedAt: user!.updatedAt,
      }),
    onSuccess: () => {
      toast.success('Đã cập nhật hồ sơ người dùng thành công.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') =>
      api.admin.updateStatus(userId, { status, expectedUpdatedAt: user!.updatedAt }),
    onSuccess: (_, status) => {
      if (status === 'DELETED') {
        toast.success('Đã xóa người dùng thành công.');
        router.push('/admin/users');
      } else if (status === 'ACTIVE') {
        toast.success('Đã kích hoạt / khôi phục tài khoản thành công.');
      } else {
        toast.success('Đã cập nhật trạng thái tài khoản.');
      }
      setAction(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const revokeMutation = useMutation({
    mutationFn: () => api.admin.revokeSessions(userId),
    onSuccess: () => {
      toast.success('Đã thu hồi toàn bộ phiên đăng nhập.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const resetMutation = useMutation({
    mutationFn: ({ password, confirmation }: { password: string; confirmation: string }) =>
      api.admin.resetPassword(userId, {
        temporaryPassword: password,
        temporaryPasswordConfirmation: confirmation,
        expectedUpdatedAt: user!.updatedAt,
      }),
    onSuccess: () => {
      toast.success('Đã đặt mật khẩu tạm và thu hồi các phiên cũ.');
      setAction(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const revealMutation = useMutation({
    mutationFn: () => api.admin.revealSensitiveProfile(userId),
    onSuccess: (result) => {
      setReveal({ identity: result.identity });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const updateIdentityMutation = useMutation({
    mutationFn: (identity: { citizenId: string; issuedAt: string; issuedPlace: string } | null) =>
      api.admin.updateSensitiveIdentity(userId, {
        expectedUpdatedAt: user!.updatedAt,
        identity,
      }),
    onSuccess: (_, identity) => {
      toast.success(identity ? 'Đã cập nhật thông tin CCCD thành công.' : 'Đã xóa thông tin CCCD.');
      setAction(null);
      if (identity) {
        setReveal({ identity });
      } else {
        setReveal(null);
      }
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleOpenEditIdentity = async () => {
    if (user?.sensitiveProfile.identity.configured && !reveal?.identity) {
      try {
        const res = await revealMutation.mutateAsync();
        setEditIdentityData(res.identity);
      } catch {
        setEditIdentityData(null);
      }
    } else if (reveal?.identity) {
      setEditIdentityData(reveal.identity);
    } else {
      setEditIdentityData(null);
    }
    setAction('editIdentity');
  };


  const copyUserId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    toast.success('Đã sao chép User ID');
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-44 rounded-3xl" />
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-[520px] rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (query.isError || !user || !profile) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
        >
          <ArrowLeft className="size-4" /> Quay lại danh sách
        </Link>
        <Alert>Không thể tải thông tin người dùng. Vui lòng kiểm tra lại liên kết.</Alert>
      </div>
    );
  }

  const active = user.status === 'ACTIVE';
  const isDeleted = user.status === 'DELETED';
  const canChangeStatus = user.status === 'ACTIVE' || user.status === 'SUSPENDED';

  return (
    <div className="space-y-7">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/admin" className="hover:text-slate-700">
            Tổng quan
          </Link>
          <ChevronRight className="size-3.5 text-slate-300" />
          <Link href="/admin/users" className="hover:text-slate-700">
            Người dùng
          </Link>
          <ChevronRight className="size-3.5 text-slate-300" />
          <span className="text-slate-800 font-bold truncate max-w-48">
            @{user.username}
          </span>
        </div>

        <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-slate-600">
          <Link href="/admin/users">
            <ArrowLeft className="size-3.5" />
            <span>Quay lại</span>
          </Link>
        </Button>
      </div>

      {/* User Header Summary Card */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 p-6 shadow-xs sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
            <UserAvatar
              id={user.id}
              name={user.profile?.fullName || user.username}
              username={user.username}
              email={user.email}
              avatarUrl={user.profile?.avatarUrl}
              status={user.status}
              showStatusDot
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="truncate text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  {user.profile?.fullName || user.username}
                </h2>
                <AccountStatusBadge status={user.status} variant="dot" size="md" />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">@{user.username}</span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5 text-slate-400" />
                  <span>Đăng ký: {formatDate(user.createdAt)}</span>
                </span>
              </div>

              {/* Badges & Meta Tags */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={copyUserId}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-2xs hover:bg-slate-50"
                  title="Sao chép ID người dùng"
                >
                  <span className="text-slate-400">ID:</span>
                  <span className="font-mono text-[10px]">{user.id.slice(0, 8)}…</span>
                  {copiedId ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3 text-slate-400" />
                  )}
                </button>

                {user.roles.length ? (
                  user.roles.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                        role === 'SUPER_ADMIN'
                          ? 'bg-emerald-50 text-[#00873E] border-emerald-200'
                          : 'bg-violet-50 text-violet-700 border-violet-200'
                      }`}
                    >
                      <Shield className="size-3" />
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    Member
                  </span>
                )}

                {user.mustChangePassword ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <KeyRound className="size-3" /> Cần đổi mật khẩu
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 lg:border-t-0 lg:pt-0">
            {!isDeleted ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => revokeMutation.mutate()}
                disabled={revokeMutation.isPending}
                className="gap-1.5 border-slate-200 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
              >
                <LogOut className="size-3.5" /> Thu hồi phiên
              </Button>
            ) : null}

            {isDeleted ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => statusMutation.mutate('ACTIVE')}
                disabled={statusMutation.isPending}
                className="gap-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
              >
                <RotateCcw className="size-3.5" /> Khôi phục tài khoản
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={active ? 'destructive' : 'default'}
                  onClick={() => statusMutation.mutate(active ? 'SUSPENDED' : 'ACTIVE')}
                  disabled={!canChangeStatus || statusMutation.isPending}
                  className="gap-1.5 font-semibold shadow-2xs"
                >
                  {active ? (
                    <>
                      <Ban className="size-3.5" /> Tạm ngưng
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" /> Kích hoạt
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAction('deleteUser')}
                  disabled={statusMutation.isPending}
                  className="gap-1.5 border-rose-200 font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="size-3.5" /> Xóa người dùng
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Form & Security Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Chỉnh sửa hồ sơ tài khoản */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 sm:text-base">Thông tin tài khoản & Hồ sơ</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Lưu ý: Thay đổi thông tin liên hệ (Email, SĐT) sẽ tự động thu hồi các phiên đăng nhập.
              </p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]">
              <User className="size-4.5" />
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {/* Group 1: Thông tin đăng nhập & liên hệ */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Thông tin định danh & liên hệ
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Tên đăng nhập (Username)">
                  <Input
                    value={profile.username}
                    onChange={(event) => setProfile({ ...profile, username: event.target.value })}
                    className="h-10 text-sm"
                  />
                </Field>

                <Field label="Email">
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                    className="h-10 text-sm"
                  />
                  <CheckRow
                    label="Email đã xác minh"
                    checked={profile.emailVerified}
                    onChange={(value) => setProfile({ ...profile, emailVerified: value })}
                  />
                </Field>

                <Field label="Số điện thoại" className="sm:col-span-2">
                  <Input
                    value={profile.phone}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                    placeholder="Chưa cập nhật số điện thoại"
                    className="h-10 text-sm"
                  />
                  <CheckRow
                    label="Số điện thoại đã xác minh"
                    checked={profile.phoneVerified}
                    onChange={(value) => setProfile({ ...profile, phoneVerified: value })}
                  />
                </Field>
              </div>
            </div>

            {/* Group 2: Thông tin cá nhân */}
            <div className="border-t border-slate-100 pt-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Thông tin người dùng
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <Field label="Họ và tên">
                  <Input
                    value={profile.fullName}
                    onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                    placeholder="Nhập họ và tên đầy đủ"
                    className="h-10 text-sm"
                  />
                </Field>

                <Field label="Ngày sinh">
                  <Input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(event) => setProfile({ ...profile, dateOfBirth: event.target.value })}
                    className="h-10 text-sm"
                  />
                </Field>

                <Field label="Giới tính">
                  <Select
                    value={profile.gender}
                    onChange={(event) => setProfile({ ...profile, gender: event.target.value })}
                    className="h-10 text-sm"
                  >
                    <option value="UNSPECIFIED">Chưa xác định</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </Select>
                </Field>

                <Field label="Tỉnh / thành phố">
                  <Input
                    value={profile.city}
                    onChange={(event) => setProfile({ ...profile, city: event.target.value })}
                    placeholder="Tỉnh/Thành phố cư trú"
                    className="h-10 text-sm"
                  />
                </Field>

                <Field label="Địa chỉ cư trú" className="sm:col-span-2">
                  <Input
                    value={profile.address}
                    onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                    placeholder="Số nhà, tên đường, phường/xã…"
                    className="h-10 text-sm"
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
                className="font-semibold shadow-xs"
              >
                {profileMutation.isPending ? 'Đang lưu…' : 'Lưu cập nhật'}
              </Button>
            </div>
          </div>
        </section>

        {/* Right Column: Bảo mật, KYC & Ví ZENX */}
        <div className="space-y-6">
          {/* Security & KYC Card */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900">Bảo mật & Định danh KYC</h3>
                <p className="text-xs text-slate-500">Thông tin xác thực danh tính</p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck className="size-4.5" />
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              <InfoRow
                icon={<Mail className="size-4" />}
                label="Địa chỉ Email"
                value={user.email}
                verified={user.emailVerified}
              />
              <InfoRow
                icon={<Phone className="size-4" />}
                label="Số điện thoại"
                value={user.phone || 'Chưa cập nhật'}
                verified={user.phoneVerified}
              />
              <InfoRow
                icon={<Link2 className="size-4" />}
                label="Liên kết mạng xã hội"
                value={
                  user.socialIdentities.length
                    ? user.socialIdentities.map((item) => item.provider).join(', ')
                    : 'Chưa liên kết tài khoản nào'
                }
              />
            </div>

            {/* CCCD (Citizen Identity) Section */}
            <div className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="size-4 text-slate-500" />
                    <p className="text-xs font-bold text-slate-800">Căn cước công dân (CCCD)</p>
                  </div>
                  <p className="mt-1 font-mono text-xs font-semibold text-slate-600">
                    {user.sensitiveProfile.identity.configured
                      ? reveal?.identity?.citizenId
                        ? reveal.identity.citizenId
                        : `•••• •••• ${user.sensitiveProfile.identity.last4 ?? '****'}`
                      : 'Chưa cập nhật CCCD'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {user.sensitiveProfile.identity.configured ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revealMutation.mutate()}
                      disabled={revealMutation.isPending}
                      className="h-8 gap-1 border-slate-200 bg-white px-2.5 text-xs font-semibold hover:bg-slate-50"
                    >
                      <Eye className="size-3.5" />
                      {revealMutation.isPending ? 'Đang giải mã…' : 'Xem chi tiết'}
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant={user.sensitiveProfile.identity.configured ? 'outline' : 'default'}
                    onClick={handleOpenEditIdentity}
                    disabled={revealMutation.isPending}
                    className="h-8 gap-1 px-2.5 text-xs font-semibold border-slate-200"
                  >
                    <Pencil className="size-3.5" />
                    {user.sensitiveProfile.identity.configured ? 'Chỉnh sửa' : 'Thêm CCCD'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Reset Temporary Password */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                className="w-full justify-center gap-2 border-slate-200 font-semibold text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                onClick={() => setAction('password')}
              >
                <KeyRound className="size-4 text-purple-600" /> Đặt mật khẩu tạm thời
              </Button>
            </div>
          </section>

          {/* ZENX Wallet Section */}
          <WalletSection user={user} />
        </div>
      </div>

      {/* Modals & Dialogs */}
      {action === 'password' ? (
        <PasswordDialog
          user={user}
          onClose={() => setAction(null)}
          onSubmit={(password, confirmation) => resetMutation.mutate({ password, confirmation })}
          pending={resetMutation.isPending}
        />
      ) : null}

      {action === 'editIdentity' ? (
        <EditIdentityDialog
          user={user}
          initialIdentity={editIdentityData}
          onClose={() => setAction(null)}
          onSubmit={(identity) => updateIdentityMutation.mutate(identity)}
          pending={updateIdentityMutation.isPending}
        />
      ) : null}

      {action === 'deleteUser' ? (
        <DeleteUserDialog
          user={user}
          onClose={() => setAction(null)}
          onConfirm={() => statusMutation.mutate('DELETED')}
          pending={statusMutation.isPending}
        />
      ) : null}

      {reveal ? (
        <RevealDialog
          identity={reveal.identity}
          onClose={() => {
            setReveal(null);
            revealMutation.reset();
          }}
          onEdit={() => {
            setEditIdentityData(reveal.identity);
            setReveal(null);
            setAction('editIdentity');
          }}
        />
      ) : null}
    </div>
  );
}

type ProfileForm = {
  username: string;
  email: string;
  phone: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  city: string;
  address: string;
  emailVerified: boolean;
  phoneVerified: boolean;
};

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="mt-2 flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
      />
      <span>{label}</span>
    </label>
  );
}

function InfoRow({
  icon,
  label,
  value,
  verified,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50/60 p-3 border border-slate-100">
      <span className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-2xs">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="truncate text-xs font-bold text-slate-800">{value}</p>
      </div>
      {verified !== undefined ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            verified
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {verified ? <CheckCircle2 className="size-3" /> : null}
          {verified ? 'Đã xác minh' : 'Chưa xác minh'}
        </span>
      ) : null}
    </div>
  );
}

function WalletSection({ user }: { user: AdminUserDetail }) {
  const adjustment = useAdminFinanceWalletAdjustment(user.id);
  const [kind, setKind] = useState<'credit' | 'debit' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const pending = adjustment.credit.isPending || adjustment.debit.isPending;
  const submitAdjustment = () => {
    if (!kind || !/^\d+$/.test(amount) || BigInt(amount || '0') <= BigInt(0)) {
      toast.error('Số Coin phải là số nguyên dương.');
      return;
    }
    const input = { clientRequestId: createClientRequestId(), amount, note: note.trim() || undefined };
    const mutation = kind === 'credit' ? adjustment.credit : adjustment.debit;
    mutation.mutate(input, {
      onSuccess: () => { toast.success(kind === 'credit' ? 'Đã cộng Coin vào ví.' : 'Đã trừ Coin khỏi ví.'); setKind(null); setAmount(''); setNote(''); },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900">Ví ZENX · Chế độ xem</h3>
          <p className="text-xs text-slate-500">Số dư hiện tại & lịch sử biến động Coin</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setKind('credit')}>Cộng Coin</Button>
          <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setKind('debit')}>Trừ Coin</Button>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-[#00873E]"><WalletCards className="size-4.5" /></div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xs">
        <p className="text-xs font-medium text-slate-400">Số dư khả dụng</p>
        <p className="mt-1 text-3xl font-black tracking-tight text-white">
          {formatAmount(user.wallet?.balance)}{' '}
          <span className="text-sm font-bold text-emerald-400">
            {user.wallet?.currency ?? 'ZENX'}
          </span>
        </p>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Giao dịch gần đây
        </p>
        <div className="mt-2 divide-y divide-slate-100">
          {user.recentTransactions.length ? (
            user.recentTransactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.transactionNo}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">
                    {transactionTypeLabel(transaction.type)}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {transaction.transactionNo} · {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <span
                  className={`text-xs font-black whitespace-nowrap ${
                    transaction.type === 'DEBIT' ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {transaction.type === 'DEBIT' ? '-' : '+'}
                  {formatAmount(transaction.amount)}
                </span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-xs text-slate-400">Chưa có lịch sử giao dịch.</p>
          )}
        </div>
      </div>
      {kind ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h4 className="text-lg font-black text-slate-900">{kind === 'credit' ? 'Cộng Coin vào ví' : 'Trừ Coin khỏi ví'}</h4><p className="mt-1 text-xs text-slate-500">Số dư hiện tại: <strong>{formatAmount(user.wallet?.balance)} ZENX</strong></p></div><Button variant="ghost" size="icon" onClick={() => setKind(null)}><X className="size-4" /></Button></div><div className="mt-5 space-y-4"><label className="block text-xs font-bold text-slate-600">Số Coin<Input className="mt-1.5" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ''))} placeholder="1000" /></label><label className="block text-xs font-bold text-slate-600">Ghi chú tùy chọn<Input className="mt-1.5" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Điều chỉnh số dư…" /></label><div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{amount && /^\d+$/.test(amount) ? <>Số dư dự kiến: <strong className={kind === 'credit' ? 'text-emerald-700' : 'text-red-700'}>{formatAmount(kind === 'credit' ? BigInt(String(user.wallet?.balance ?? 0)) + BigInt(amount) : BigInt(String(user.wallet?.balance ?? 0)) - BigInt(amount))} ZENX</strong></> : 'Nhập số Coin để xem số dư dự kiến.'}</div></div><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => setKind(null)}>Hủy</Button><Button variant={kind === 'debit' ? 'destructive' : 'default'} onClick={submitAdjustment} disabled={pending}>{pending ? 'Đang xử lý…' : 'Xác nhận'}</Button></div></div></div> : null}
    </section>
  );
}

function createClientRequestId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function PasswordDialog({
  user,
  onClose,
  onSubmit,
  pending,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onSubmit: (password: string, confirmation: string) => void;
  pending: boolean;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const submit = () => {
    if (password.length < 8 || password !== confirmation) return;
    onSubmit(password, confirmation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Đặt mật khẩu tạm thời</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Nhập mật khẩu mới cho tài khoản <strong className="text-slate-800">@{user.username}</strong>.
            </p>
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3.5">
            <Field label="Mật khẩu tạm mới">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                className="h-10 text-sm"
              />
            </Field>
            <Field label="Xác nhận mật khẩu tạm">
              <Input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu tạm"
                className="h-10 text-sm"
              />
            </Field>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * Mật khẩu yêu cầu gồm chữ hoa, chữ thường, số và ký tự đặc biệt. Người dùng sẽ bị bắt
              buộc đổi mật khẩu ở lần đăng nhập tới.
            </p>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Hủy bỏ
          </Button>
          <Button
            onClick={submit}
            disabled={pending || password.length < 8 || password !== confirmation}
          >
            {pending ? 'Đang xử lý…' : 'Đặt mật khẩu'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RevealDialog({
  identity,
  onClose,
  onEdit,
}: {
  identity: { citizenId: string; issuedAt: string; issuedPlace: string } | null;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const [copiedCccd, setCopiedCccd] = useState(false);

  const copyCccd = () => {
    if (!identity?.citizenId) return;
    navigator.clipboard.writeText(identity.citizenId);
    setCopiedCccd(true);
    toast.success('Đã sao chép số CCCD');
    setTimeout(() => setCopiedCccd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldCheck className="size-4" />
            </div>
            <h2 className="text-base font-black text-slate-900">Thông tin CCCD đã giải mã</h2>
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>

        {identity ? (
          <div className="mt-5 space-y-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 p-5 text-sm">
            <div>
              <span className="text-xs font-semibold text-amber-700">Số Căn cước công dân</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-base font-black tracking-widest text-slate-900">
                  {identity.citizenId}
                </span>
                <button
                  onClick={copyCccd}
                  className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-amber-800 shadow-2xs border border-amber-200 hover:bg-amber-50"
                >
                  {copiedCccd ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  {copiedCccd ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-amber-200/60">
              <div>
                <span className="text-[11px] font-medium text-amber-700">Ngày cấp</span>
                <p className="mt-0.5 font-bold text-slate-800">{formatDateOnly(identity.issuedAt)}</p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-amber-700">Nơi cấp</span>
                <p className="mt-0.5 font-bold text-slate-800">{identity.issuedPlace}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
            Tài khoản chưa có thông tin CCCD được cấu hình.
          </p>
        )}

        <div className="mt-6 flex gap-2.5">
          {identity && onEdit ? (
            <Button
              variant="outline"
              className="flex-1 font-semibold border-slate-200 hover:bg-slate-50 gap-1.5"
              onClick={onEdit}
            >
              <Pencil className="size-3.5" /> Chỉnh sửa
            </Button>
          ) : null}
          <Button className="flex-1 font-semibold" onClick={onClose}>
            Đóng thông tin
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditIdentityDialog({
  user,
  initialIdentity,
  onClose,
  onSubmit,
  pending,
}: {
  user: AdminUserDetail;
  initialIdentity: { citizenId: string; issuedAt: string; issuedPlace: string } | null;
  onClose: () => void;
  onSubmit: (identity: { citizenId: string; issuedAt: string; issuedPlace: string } | null) => void;
  pending: boolean;
}) {
  const [citizenId, setCitizenId] = useState(initialIdentity?.citizenId ?? '');
  const [issuedAt, setIssuedAt] = useState(initialIdentity?.issuedAt?.slice(0, 10) ?? '');
  const [issuedPlace, setIssuedPlace] = useState(initialIdentity?.issuedPlace ?? 'Cục Cảnh sát QLHC về TTXH');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isValidCitizenId = /^\d{12}$/.test(citizenId.trim());
  const isValidDate = Boolean(issuedAt) && issuedAt <= new Date().toISOString().slice(0, 10);
  const isValidPlace = Boolean(issuedPlace.trim());
  const canSubmit = isValidCitizenId && isValidDate && isValidPlace;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      citizenId: citizenId.trim(),
      issuedAt,
      issuedPlace: issuedPlace.trim(),
    });
  };

  const handleDelete = () => {
    onSubmit(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              {user.sensitiveProfile.identity.configured ? 'Chỉnh sửa thông tin CCCD' : 'Thêm mới số CCCD'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Cập nhật thông tin Căn cước công dân cho tài khoản{' '}
              <strong className="text-slate-800">@{user.username}</strong>.
            </p>
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="Số CCCD (12 chữ số)">
            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                value={citizenId}
                onChange={(e) => setCitizenId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Ví dụ: 001201012345"
                className="h-10 font-mono tracking-wider text-sm pr-14"
                maxLength={12}
                autoFocus
              />
              <span
                className={`absolute right-3 top-2.5 text-[11px] font-mono font-semibold ${
                  citizenId.length === 12 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {citizenId.length}/12
              </span>
            </div>
          </Field>

          <Field label="Ngày cấp">
            <Input
              type="date"
              value={issuedAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setIssuedAt(e.target.value)}
              className="h-10 text-sm"
            />
          </Field>

          <Field label="Nơi cấp">
            <Input
              type="text"
              value={issuedPlace}
              onChange={(e) => setIssuedPlace(e.target.value)}
              placeholder="Ví dụ: Cục Cảnh sát QLHC về TTXH"
              maxLength={160}
              className="h-10 text-sm"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {['Cục Cảnh sát QLHC về TTXH', 'Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư'].map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => setIssuedPlace(place)}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  {place}
                </button>
              ))}
            </div>
          </Field>

          {showConfirmDelete ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs">
              <p className="font-semibold text-rose-800">Xác nhận xóa thông tin CCCD của người dùng này?</p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={pending}
                  className="h-7 px-2.5 text-xs font-semibold"
                >
                  {pending ? 'Đang xóa…' : 'Xóa ngay'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={pending}
                  className="h-7 px-2.5 text-xs"
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between pt-2 border-t border-slate-100">
            {user.sensitiveProfile.identity.configured && !showConfirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                disabled={pending}
                className="h-9 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="size-3.5 mr-1" /> Xóa CCCD
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
                Hủy
              </Button>
              <Button type="submit" disabled={!canSubmit || pending}>
                {pending ? 'Đang lưu…' : 'Lưu thông tin'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteUserDialog({
  user,
  onClose,
  onConfirm,
  pending,
}: {
  user: AdminUserDetail;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <Trash2 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Xác nhận xóa tài khoản?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Bạn đang thực hiện xóa mềm tài khoản <strong className="text-slate-800">@{user.username}</strong> ({user.email}).
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-rose-50/70 border border-rose-200/80 p-3.5 text-xs text-rose-900 leading-relaxed">
          <ul className="list-disc pl-4 space-y-1 text-slate-700">
            <li>Tài khoản sẽ chuyển sang trạng thái <strong>Đã xóa (DELETED)</strong>.</li>
            <li>Toàn bộ phiên đăng nhập của người dùng sẽ bị <strong>thu hồi ngay lập tức</strong>.</li>
            <li>Lịch sử số dư ví, nạp tiền và ticket vẫn được bảo toàn để phục vụ đối soát.</li>
            <li>Bạn có thể khôi phục lại tài khoản này bất cứ lúc nào khi cần.</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Hủy bỏ
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
            className="font-semibold gap-1.5"
          >
            {pending ? 'Đang xử lý…' : (
              <>
                <Trash2 className="size-4" /> Xác nhận xóa
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
