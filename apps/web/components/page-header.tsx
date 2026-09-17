import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  /** Tiêu đề trang */
  title: React.ReactNode;
  /** Mô tả chi tiết bên dưới tiêu đề */
  description?: React.ReactNode;
  /** Icon đại diện cho trang (đồng nhất với icon sidebar navigation) */
  icon?: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  /** Thẻ gắn nhỏ phía trên tiêu đề (tùy chọn) */
  eyebrow?: React.ReactNode;
  /** Huy hiệu / badge hiển thị ngay bên cạnh tiêu đề */
  badge?: React.ReactNode;
  /** Các nút hành động phía bên phải (ví dụ: Button Nạp coin, Làm mới...) */
  actions?: React.ReactNode;
  /** Lớp CSS tùy biến cho container */
  className?: string;
  /** Nội dung bổ sung bên dưới (ví dụ tabs, thanh filter...) */
  children?: React.ReactNode;
}

function renderIcon(icon: PageHeaderProps['icon']) {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === 'function' || typeof icon === 'object') {
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="size-3.5 sm:size-4 text-[#00873E]" />;
  }
  return icon;
}

export function PageHeader({
  title,
  description,
  icon,
  eyebrow,
  badge,
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {eyebrow && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#00873E]">
          {eyebrow}
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {icon && (
              <div className="flex size-7 sm:size-7.5 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00873E] border border-emerald-200/70 shadow-2xs">
                {renderIcon(icon)}
              </div>
            )}

            <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>

            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {description && (
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
