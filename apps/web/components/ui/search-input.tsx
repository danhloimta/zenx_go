'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onClear?: () => void;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  sizeVariant?: 'sm' | 'default' | 'lg';
  containerClassName?: string;
}

const sizeConfig = {
  sm: {
    height: 'h-9',
    text: 'text-xs',
    paddingLeft: 'pl-9',
    paddingRight: 'pr-9',
    iconSize: 'size-3.5',
    iconLeft: 'left-3',
    clearRight: 'right-2.5',
    clearSize: 'size-3.5',
  },
  default: {
    height: 'h-10',
    text: 'text-sm',
    paddingLeft: 'pl-10',
    paddingRight: 'pr-9',
    iconSize: 'size-4',
    iconLeft: 'left-3.5',
    clearRight: 'right-3',
    clearSize: 'size-4',
  },
  lg: {
    height: 'h-11',
    text: 'text-sm',
    paddingLeft: 'pl-11',
    paddingRight: 'pr-10',
    iconSize: 'size-4.5',
    iconLeft: 'left-4',
    clearRight: 'right-3.5',
    clearSize: 'size-4',
  },
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    className,
    containerClassName,
    value,
    defaultValue,
    onChange,
    onClear,
    isLoading = false,
    leftIcon,
    sizeVariant = 'sm',
    disabled,
    placeholder = 'Tìm kiếm…',
    ...props
  },
  ref,
) {
  const config = sizeConfig[sizeVariant] || sizeConfig.sm;
  const hasValue = Boolean(value !== undefined ? String(value).length > 0 : defaultValue);

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div
      className={cn(
        'group relative flex w-full items-center transition-all',
        containerClassName,
      )}
    >
      {/* Left Icon (Search or Loading) */}
      <span
        className={cn(
          'pointer-events-none absolute flex items-center justify-center text-slate-400 group-focus-within:text-[#00873E] transition-colors',
          config.iconLeft,
        )}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin text-[#00873E]', config.iconSize)} />
        ) : leftIcon ? (
          leftIcon
        ) : (
          <Search className={config.iconSize} />
        )}
      </span>

      {/* Input Field */}
      <input
        ref={ref}
        type="search"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none transition-all duration-150',
          'hover:border-slate-300',
          'focus:border-[#00873E] focus:ring-2 focus:ring-[#00873E]/10 focus:bg-white',
          'shadow-2xs',
          config.height,
          config.text,
          config.paddingLeft,
          config.paddingRight,
          disabled && 'cursor-not-allowed bg-slate-50 text-slate-400 opacity-60 hover:border-slate-200',
          '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none',
          className,
        )}
        {...props}
      />

      {/* Clear Button */}
      {hasValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          tabIndex={-1}
          aria-label="Xóa nội dung tìm kiếm"
          className={cn(
            'absolute flex items-center justify-center rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer',
            config.clearRight,
          )}
        >
          <X className={config.clearSize} />
        </button>
      )}
    </div>
  );
});
