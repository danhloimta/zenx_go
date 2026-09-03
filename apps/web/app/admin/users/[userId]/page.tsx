'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
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
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUserDetail } from '@zenx-go/api-client';
import { useAdminUser } from '@/hooks/use-admin';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { formatAmount, formatDate, transactionTypeLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type Action = 'status' | 'revoke' | 'password' | 'reveal' | null;

export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const userId = typeof params.userId === 'string' ? decodeURIComponent(params.userId) : '';
  const query = useAdminUser(userId);
  const user = query.data;
  const queryClient = useQueryClient();
  const [action, setAction] = useState<Action>(null);
  const [reveal, setReveal] = useState<{
    identity: { citizenId: string; issuedAt: string; issuedPlace: string } | null;
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
      reason: '',
    });
  }, [user]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
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
      toast.success('Đã cập nhật hồ sơ người dùng.');
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: 'ACTIVE' | 'SUSPENDED'; reason: string }) =>
      api.admin.updateStatus(userId, { status, reason, expectedUpdatedAt: user!.updatedAt }),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái tài khoản.');
      setAction(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const revokeMutation = useMutation({
    mutationFn: (reason: string) => api.admin.revokeSessions(userId, { reason }),
    onSuccess: () => {
      toast.success('Đã thu hồi toàn bộ phiên đăng nhập.');
      setAction(null);
      invalidate();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const resetMutation = useMutation({
    mutationFn: ({
      password,
      confirmation,
      reason,
    }: {
      password: string;
      confirmation: string;
      reason: string;
    }) =>
      api.admin.resetPassword(userId, {
        temporaryPassword: password,
        temporaryPasswordConfirmation: confirmation,
        reason,
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
    mutationFn: (reason: string) => api.admin.revealSensitiveProfile(userId, { reason }),
    onSuccess: (result) => {
      setAction(null);
      setReveal({ identity: result.identity });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  if (query.isLoading) return <Skeleton className="h-[720px] rounded-2xl" />;
  if (query.isError || !user || !profile)
    return (
      <div className="space-y-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
        >
          <ArrowLeft className="size-4" /> Quay lại người dùng
        </Link>
        <Alert>Không thể tải thông tin người dùng.</Alert>
      </div>
    );
  const active = user.status === 'ACTIVE';
  const canChangeStatus = user.status === 'ACTIVE' || user.status === 'SUSPENDED';
  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#00873E]"
      >
        <ArrowLeft className="size-4" /> Quay lại người dùng
      </Link>
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-[#00873E]">
              {user.profile?.avatarUrl ? (
                <img src={user.profile.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-8" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-2xl font-black text-slate-900">
                  {user.profile?.fullName || user.username}
                </h2>
                <StatusPill status={user.status ?? ''} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                @{user.username} · Tạo ngày {formatDate(user.createdAt)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                {user.roles.length ? (
                  user.roles.map((role) => (
                    <Badge key={role} variant="zenx">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge>User</Badge>
                )}
                {user.mustChangePassword ? <Badge variant="warning">Cần đổi mật khẩu</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setAction('revoke')}>
              <LogOut className="size-4" /> Thu hồi phiên
            </Button>
            <Button
              size="sm"
              variant={active ? 'destructive' : 'secondary'}
              onClick={() => setAction('status')}
              disabled={!canChangeStatus}
            >
              {active ? (
                <>
                  <Ban className="size-4" /> Tạm ngưng
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" /> Kích hoạt
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900">Thông tin tài khoản</h3>
              <p className="mt-1 text-xs text-slate-500">
                Thay đổi liên hệ sẽ thu hồi phiên đăng nhập hiện tại.
              </p>
            </div>
            <ShieldCheck className="size-5 text-[#00873E]" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Tên đăng nhập">
              <Input
                value={profile.username}
                onChange={(event) => setProfile({ ...profile, username: event.target.value })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              />
              <CheckRow
                label="Email đã xác minh"
                checked={profile.emailVerified}
                onChange={(value) => setProfile({ ...profile, emailVerified: value })}
              />
            </Field>
            <Field label="Số điện thoại">
              <Input
                value={profile.phone}
                onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
              />
              <CheckRow
                label="Số điện thoại đã xác minh"
                checked={profile.phoneVerified}
                onChange={(value) => setProfile({ ...profile, phoneVerified: value })}
              />
            </Field>
            <Field label="Họ và tên">
              <Input
                value={profile.fullName}
                onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
              />
            </Field>
            <Field label="Ngày sinh">
              <Input
                type="date"
                value={profile.dateOfBirth}
                onChange={(event) => setProfile({ ...profile, dateOfBirth: event.target.value })}
              />
            </Field>
            <Field label="Giới tính">
              <Select
                value={profile.gender}
                onChange={(event) => setProfile({ ...profile, gender: event.target.value })}
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
              />
            </Field>
            <Field label="Địa chỉ">
              <Input
                value={profile.address}
                onChange={(event) => setProfile({ ...profile, address: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Lý do cập nhật" className="mt-4">
            <Textarea
              value={profile.reason}
              onChange={(event) => setProfile({ ...profile, reason: event.target.value })}
              placeholder="Nhập lý do để lưu vào nhật ký…"
            />
            <p className="mt-1 text-[11px] text-slate-400">Tối thiểu 5 ký tự.</p>
          </Field>
          <div className="mt-5 flex justify-end">
            <Button
              onClick={() => profileMutation.mutate()}
              disabled={profileMutation.isPending || profile.reason.trim().length < 5}
            >
              {profileMutation.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
            </Button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <h3 className="font-black text-slate-900">Bảo mật và định danh</h3>
            <div className="mt-5 space-y-3">
              <InfoRow
                icon={<Mail className="size-4" />}
                label="Email"
                value={user.email}
                verified={user.emailVerified}
              />
              <InfoRow
                icon={<Phone className="size-4" />}
                label="Điện thoại"
                value={user.phone || 'Chưa cập nhật'}
                verified={user.phoneVerified}
              />
              <InfoRow
                icon={<Link2 className="size-4" />}
                label="Đăng nhập mạng xã hội"
                value={
                  user.socialIdentities.length
                    ? user.socialIdentities.map((item) => item.provider).join(', ')
                    : 'Chưa liên kết'
                }
              />
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">CCCD</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {user.sensitiveProfile.identity.configured
                      ? `•••• •••• ${user.sensitiveProfile.identity.last4 ?? '****'}`
                      : 'Chưa thiết lập'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAction('reveal')}
                  disabled={!user.sensitiveProfile.identity.configured}
                >
                  <Eye className="size-4" /> Xem đầy đủ
                </Button>
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => setAction('password')}
              >
                <KeyRound className="size-4" /> Đặt mật khẩu tạm
              </Button>
            </div>
          </section>
          <WalletSection user={user} />
        </div>
      </div>
      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-black text-slate-900">Nhật ký liên quan</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {user.auditLogs.length ? (
            user.auditLogs.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{auditLabel(entry.action)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{entry.reason}</p>
                </div>
                <span className="text-[11px] text-slate-400">
                  {entry.actorUsername ?? 'admin'} · {formatDate(entry.createdAt)}
                </span>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">Chưa có hoạt động.</p>
          )}
        </div>
      </section>
      {action ? (
        <ActionDialog
          action={action}
          user={user}
          onClose={() => setAction(null)}
          onStatus={(status, reason) => statusMutation.mutate({ status, reason })}
          onRevoke={(reason) => revokeMutation.mutate(reason)}
          onPassword={(password, confirmation, reason) =>
            resetMutation.mutate({ password, confirmation, reason })
          }
          onReveal={(reason) => revealMutation.mutate(reason)}
          pending={
            statusMutation.isPending ||
            revokeMutation.isPending ||
            resetMutation.isPending ||
            revealMutation.isPending
          }
        />
      ) : null}
      {reveal ? (
        <RevealDialog
          identity={reveal.identity}
          onClose={() => {
            setReveal(null);
            revealMutation.reset();
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
  reason: string;
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
    <label className={`block space-y-2 ${className}`}>
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
    <label className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 rounded border-slate-300 text-[#00873E] focus:ring-[#00873E]"
      />
      {label}
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
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="truncate text-xs font-semibold text-slate-700">{value}</p>
      </div>
      {verified !== undefined ? (
        <span
          className={`text-[10px] font-bold ${verified ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          {verified ? 'Đã xác minh' : 'Chưa xác minh'}
        </span>
      ) : null}
    </div>
  );
}
function StatusPill({ status }: { status: string }) {
  const meta = (
    {
      ACTIVE: ['Đang hoạt động', 'success'],
      SUSPENDED: ['Tạm ngưng', 'default'],
      LOCKED: ['Bị khóa', 'destructive'],
      PENDING: ['Chờ xác minh', 'warning'],
    } as Record<string, [string, 'success' | 'default' | 'destructive' | 'warning']>
  )[status] ?? [status, 'default'];
  return <Badge variant={meta[1]}>{meta[0]}</Badge>;
}
function WalletSection({ user }: { user: AdminUserDetail }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-slate-900">Ví ZENX · chỉ xem</h3>
          <p className="mt-1 text-xs text-slate-500">
            Không có thao tác cộng/trừ Coin trong Phase 1.
          </p>
        </div>
        <WalletCards className="size-5 text-[#00873E]" />
      </div>
      <p className="mt-5 text-3xl font-black text-slate-900">
        {formatAmount(user.wallet?.balance)}{' '}
        <span className="text-sm text-[#00873E]">{user.wallet?.currency ?? 'ZENX'}</span>
      </p>
      <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
        {user.recentTransactions.length ? (
          user.recentTransactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.transactionNo}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  {transactionTypeLabel(transaction.type)}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {transaction.transactionNo} · {formatDate(transaction.createdAt)}
                </p>
              </div>
              <span
                className={`text-xs font-bold ${transaction.type === 'DEBIT' ? 'text-red-600' : 'text-emerald-600'}`}
              >
                {transaction.type === 'DEBIT' ? '-' : '+'}
                {formatAmount(transaction.amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="py-5 text-center text-xs text-slate-400">Chưa có giao dịch.</p>
        )}
      </div>
    </section>
  );
}
function auditLabel(action: string) {
  return (
    (
      {
        PROFILE_UPDATED: 'Cập nhật hồ sơ',
        STATUS_CHANGED: 'Đổi trạng thái',
        SESSIONS_REVOKED: 'Thu hồi phiên',
        PASSWORD_RESET: 'Đặt mật khẩu tạm',
        SENSITIVE_PROFILE_REVEALED: 'Xem CCCD',
      } as Record<string, string>
    )[action] ?? action
  );
}

function ActionDialog({
  action,
  user,
  onClose,
  onStatus,
  onRevoke,
  onPassword,
  onReveal,
  pending,
}: {
  action: Exclude<Action, null>;
  user: AdminUserDetail;
  onClose: () => void;
  onStatus: (status: 'ACTIVE' | 'SUSPENDED', reason: string) => void;
  onRevoke: (reason: string) => void;
  onPassword: (password: string, confirmation: string, reason: string) => void;
  onReveal: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const title =
    action === 'status'
      ? user.status === 'ACTIVE'
        ? 'Tạm ngưng tài khoản'
        : 'Kích hoạt tài khoản'
      : action === 'revoke'
        ? 'Thu hồi phiên đăng nhập'
        : action === 'password'
          ? 'Đặt mật khẩu tạm'
          : 'Xem CCCD đầy đủ';
  const submit = () => {
    if (reason.trim().length < 5) return;
    if (action === 'status')
      onStatus(user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', reason.trim());
    else if (action === 'revoke') onRevoke(reason.trim());
    else if (action === 'password') {
      if (password !== confirmation || password.length < 8) return;
      onPassword(password, confirmation, reason.trim());
    } else onReveal(reason.trim());
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">{title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Tác vụ trên @{user.username} sẽ được ghi vào nhật ký quản trị.
            </p>
          </div>
          <button
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        {action === 'password' ? (
          <div className="mt-5 space-y-4">
            <Field label="Mật khẩu tạm">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Xác nhận mật khẩu tạm">
              <Input
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <p className="text-[11px] text-slate-500">
              Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt. User sẽ bắt buộc đổi sau
              lần đăng nhập tiếp theo.
            </p>
          </div>
        ) : null}
        <Field label="Lý do" className="mt-5">
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Nhập lý do (tối thiểu 5 ký tự)…"
          />
        </Field>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant={action === 'status' && user.status === 'ACTIVE' ? 'destructive' : 'default'}
            onClick={submit}
            disabled={
              pending ||
              reason.trim().length < 5 ||
              (action === 'password' && (password.length < 8 || password !== confirmation))
            }
          >
            {pending ? 'Đang xử lý…' : 'Xác nhận'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RevealDialog({
  identity,
  onClose,
}: {
  identity: { citizenId: string; issuedAt: string; issuedPlace: string } | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Thông tin CCCD</h2>
          <button
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>
        </div>
        {identity ? (
          <div className="mt-5 space-y-3 rounded-xl bg-amber-50 p-4 text-sm">
            <p>
              <span className="text-xs text-slate-500">Số CCCD</span>
              <br />
              <strong className="tracking-wider">{identity.citizenId}</strong>
            </p>
            <p>
              <span className="text-xs text-slate-500">Ngày cấp</span>
              <br />
              <strong>{formatDate(identity.issuedAt)}</strong>
            </p>
            <p>
              <span className="text-xs text-slate-500">Nơi cấp</span>
              <br />
              <strong>{identity.issuedPlace}</strong>
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Tài khoản chưa có thông tin CCCD.
          </p>
        )}
        <Button className="mt-5 w-full" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </div>
  );
}
