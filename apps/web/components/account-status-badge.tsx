import type { AccountStatus } from '@zenx-go/api-client';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock3, Ban, ShieldAlert, Trash2 } from 'lucide-react';

export interface AccountStatusBadgeProps {
  status?: AccountStatus | string | null;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'dot' | 'icon';
}

const statusConfig: Record<
  string,
  {
    label: string;
    dot: string;
    bg: string;
    text: string;
    border: string;
    icon: typeof CheckCircle2;
  }
> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/80',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Chờ xác minh',
    dot: 'bg-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200/80',
    icon: Clock3,
  },
  SUSPENDED: {
    label: 'Tạm ngưng',
    dot: 'bg-slate-500',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200/80',
    icon: Ban,
  },
  LOCKED: {
    label: 'Bị khóa',
    dot: 'bg-rose-500',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200/80',
    icon: ShieldAlert,
  },
  DELETED: {
    label: 'Đã xóa',
    dot: 'bg-rose-600',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200/80',
    icon: Trash2,
  },
};

export function AccountStatusBadge({
  status,
  className,
  size = 'sm',
  variant = 'dot',
}: AccountStatusBadgeProps) {
  const meta = (status && statusConfig[status]) || {
    label: status || 'Chưa xác định',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: Clock3,
  };

  const Icon = meta.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-md border font-semibold select-none transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        meta.bg,
        meta.text,
        meta.border,
        className,
      )}
    >
      {variant === 'icon' ? (
        <Icon className={cn('shrink-0', size === 'sm' ? 'size-3' : 'size-3.5')} />
      ) : (
        <span className={cn('size-1.5 rounded-full shrink-0', meta.dot)} />
      )}
      <span className="leading-tight">{meta.label}</span>
    </span>
  );
}
