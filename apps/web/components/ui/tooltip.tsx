import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

export function InfoTooltip({
  content,
  className,
  side = 'top',
}: {
  content: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <span className={cn('group/tooltip relative inline-flex items-center align-middle', className)}>
      <span
        role="button"
        tabIndex={0}
        aria-label="Thông tin thêm"
        className="inline-flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100 cursor-help"
      >
        <Info className="size-3.5" />
      </span>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none invisible absolute z-50 rounded-lg bg-slate-900 px-2.5 py-1.5 text-left text-xs font-normal leading-relaxed text-slate-100 shadow-xl opacity-0 transition-all duration-150 group-hover/tooltip:visible group-hover/tooltip:opacity-100 w-max max-w-xs whitespace-normal',
          side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
          side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1.5',
          side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1.5',
          side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1.5',
        )}
      >
        {content}
      </span>
    </span>
  );
}

export function Tooltip({
  children,
  content,
  className,
  side = 'top',
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <span className={cn('group/tooltip relative inline-flex items-center', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none invisible absolute z-50 rounded-lg bg-slate-900 px-2.5 py-1.5 text-left text-xs font-normal leading-relaxed text-slate-100 shadow-xl opacity-0 transition-all duration-150 group-hover/tooltip:visible group-hover/tooltip:opacity-100 w-max max-w-xs whitespace-normal',
          side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
          side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1.5',
          side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1.5',
          side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1.5',
        )}
      >
        {content}
      </span>
    </span>
  );
}
