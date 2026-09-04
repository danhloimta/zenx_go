'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UserRound } from 'lucide-react';

const avatarGradients = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-rose-600',
  'from-indigo-500 to-sky-600',
];

export function getAvatarGradient(seed?: string | null): string {
  if (!seed) return avatarGradients[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % avatarGradients.length;
  return avatarGradients[index];
}

export function getUserInitials(name?: string | null, fallback = 'U'): string {
  if (!name || !name.trim()) return fallback.slice(0, 2).toUpperCase();
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'size-7', text: 'text-[10px]', dot: 'size-2 -bottom-0.5 -right-0.5 ring-1.5' },
  sm: { container: 'size-8', text: 'text-xs', dot: 'size-2.5 -bottom-0.5 -right-0.5 ring-2' },
  md: { container: 'size-10', text: 'text-sm font-bold', dot: 'size-3 bottom-0 right-0 ring-2' },
  lg: { container: 'size-12', text: 'text-base font-bold', dot: 'size-3.5 bottom-0 right-0 ring-2' },
  xl: { container: 'size-16', text: 'text-xl font-black', dot: 'size-4 bottom-0.5 right-0.5 ring-2.5' },
};

const statusDotColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500',
  PENDING: 'bg-amber-400',
  SUSPENDED: 'bg-slate-400',
  LOCKED: 'bg-rose-500',
};

export interface UserAvatarProps {
  id?: string | null;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: AvatarSize;
  className?: string;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'LOCKED' | string | null;
  showStatusDot?: boolean;
}

export function UserAvatar({
  id,
  name,
  username,
  email,
  avatarUrl,
  size = 'md',
  className,
  status,
  showStatusDot = false,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const seed = id || username || email || name || '';
  const gradient = getAvatarGradient(seed);
  const initials = getUserInitials(name || username || email || '', 'U');
  const sizeConfig = sizeClasses[size];

  const hasValidImage = Boolean(avatarUrl && !imageError);

  return (
    <div className={cn('relative inline-flex shrink-0 select-none', sizeConfig.container, className)}>
      <div
        className={cn(
          'flex size-full items-center justify-center overflow-hidden rounded-xl font-semibold shadow-2xs transition duration-150',
          hasValidImage
            ? 'bg-slate-100 ring-1 ring-slate-200/80'
            : cn('bg-gradient-to-tr text-white', gradient),
        )}
      >
        {hasValidImage ? (
          <img
            src={avatarUrl!}
            alt={name || username || 'Avatar'}
            onError={() => setImageError(true)}
            className="size-full object-cover"
          />
        ) : initials ? (
          <span className={sizeConfig.text}>{initials}</span>
        ) : (
          <UserRound className="size-1/2 text-white/80" />
        )}
      </div>

      {showStatusDot && status && statusDotColors[status] ? (
        <span
          aria-hidden="true"
          className={cn(
            'absolute rounded-full ring-white',
            sizeConfig.dot,
            statusDotColors[status],
          )}
        />
      ) : null}
    </div>
  );
}
