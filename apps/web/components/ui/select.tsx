import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  sizeVariant?: 'sm' | 'default' | 'lg';
  containerClassName?: string;
  leftIcon?: ReactNode;
}

const sizeConfig = {
  sm: {
    height: 'h-9',
    text: 'text-xs',
    paddingLeft: 'pl-3',
    paddingRight: 'pr-8',
    chevronSize: 'size-3.5',
    chevronRight: 'right-2.5',
  },
  default: {
    height: 'h-10',
    text: 'text-sm',
    paddingLeft: 'pl-3.5',
    paddingRight: 'pr-9',
    chevronSize: 'size-4',
    chevronRight: 'right-3',
  },
  lg: {
    height: 'h-11',
    text: 'text-sm',
    paddingLeft: 'pl-4',
    paddingRight: 'pr-10',
    chevronSize: 'size-4.5',
    chevronRight: 'right-3.5',
  },
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    className,
    containerClassName,
    sizeVariant = 'default',
    leftIcon,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const config = sizeConfig[sizeVariant] || sizeConfig.default;

  return (
    <div
      className={cn(
        'group relative flex w-full items-center transition-all',
        containerClassName,
      )}
    >
      {/* Optional Left Icon */}
      {leftIcon && (
        <span className="pointer-events-none absolute left-3 flex items-center text-slate-400 group-focus-within:text-[#00873E] transition-colors">
          {leftIcon}
        </span>
      )}

      {/* Select Element */}
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full appearance-none rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none transition-all duration-150',
          'hover:border-slate-300 hover:bg-slate-50/40',
          'focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 focus:bg-white',
          'shadow-2xs cursor-pointer truncate',
          config.height,
          config.text,
          leftIcon ? 'pl-9' : config.paddingLeft,
          config.paddingRight,
          disabled && 'cursor-not-allowed bg-slate-50 text-slate-400 opacity-60 hover:border-slate-200 hover:bg-slate-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>

      {/* Modern Custom Chevron Down Arrow */}
      <ChevronDown
        className={cn(
          'pointer-events-none absolute text-slate-400 group-hover:text-slate-600 transition-colors',
          config.chevronRight,
          config.chevronSize,
          disabled && 'opacity-40',
        )}
      />
    </div>
  );
});
