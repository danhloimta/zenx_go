'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type ComponentType,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  MoreHorizontal,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Inbox,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ColumnDef<T> {
  id: string;
  header: ReactNode | ((context: { column: ColumnDef<T> }) => ReactNode);
  accessorKey?: keyof T;
  cell?: (item: T, index: number) => ReactNode;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  sticky?: 'left' | 'right';
}

export interface TableAction<T> {
  key: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick?: (item: T) => void | Promise<void>;
  href?: string | ((item: T) => string);
  target?: string;
  rel?: string;
  disabled?: boolean | ((item: T) => boolean);
  hidden?: boolean | ((item: T) => boolean);
  variant?: 'default' | 'danger' | 'warning' | 'primary';
  badge?: string;
  separatorBefore?: boolean;
}

export interface TablePaginationConfig {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export interface CommonTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey?: keyof T | ((item: T, index: number) => string | number);
  
  // States
  isLoading?: boolean;
  isFetching?: boolean;
  skeletonRows?: number;

  // Index / STT Column
  showIndexColumn?: boolean;
  indexColumnHeader?: string;
  indexColumnWidth?: string | number;

  // Actions Dropdown Column
  actions?: (item: T, index: number) => TableAction<T>[];
  actionHeaderTitle?: string;
  actionColumnWidth?: string | number;
  actionColumnFixed?: boolean;
  actionTriggerVariant?: 'dots-h' | 'dots-v' | 'button';
  actionTriggerLabel?: string;

  // Empty State
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ComponentType<{ className?: string }>;
  emptyAction?: ReactNode;

  // Visual Styles
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  compact?: boolean;
  rounded?: boolean;

  // Interaction
  onRowClick?: (item: T, index: number) => void;

  // Sorting
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnId: string, direction: 'asc' | 'desc') => void;

  // Pagination
  pagination?: TablePaginationConfig;

  // Custom slots
  headerExtra?: ReactNode;
  footerExtra?: ReactNode;
  className?: string;
  containerClassName?: string;
}

// ============================================================================
// Action Dropdown Menu (Portal-based to avoid overflow clipping)
// ============================================================================

interface ActionDropdownMenuProps<T> {
  item: T;
  actions: TableAction<T>[];
  variant?: 'dots-h' | 'dots-v' | 'button';
  label?: string;
}

function ActionDropdownMenu<T>({
  item,
  actions,
  variant = 'dots-h',
  label = 'Thao tác',
}: ActionDropdownMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleActions = useMemo(() => {
    return actions.filter((act) => (typeof act.hidden === 'function' ? !act.hidden(item) : !act.hidden));
  }, [actions, item]);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = Math.min(visibleActions.length * 40 + 24, 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    const menuWidth = 190;
    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    setCoords({
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
      left,
      placeAbove,
    });
  }, [visibleActions.length]);

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isOpen) {
        setIsOpen(false);
      } else {
        updatePosition();
        setIsOpen(true);
      }
    },
    [isOpen, updatePosition],
  );

  // Close on outside click, window resize, or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  if (visibleActions.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label="Tùy chọn thao tác"
        className={cn(
          'inline-flex items-center justify-center transition-all cursor-pointer select-none',
          variant === 'button'
            ? 'h-8 gap-1.5 rounded-xl border border-slate-200/80 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
            : 'size-8 rounded-xl border border-transparent text-slate-500 hover:border-slate-200/80 hover:bg-white hover:text-slate-800 hover:shadow-2xs',
          isOpen && 'border-slate-300 bg-slate-100 text-slate-900 ring-2 ring-emerald-500/10',
        )}
      >
        {variant === 'button' ? (
          <>
            <span className="text-xs font-semibold">{label}</span>
            <MoreHorizontal className="size-3.5 text-slate-500" />
          </>
        ) : variant === 'dots-v' ? (
          <MoreVertical className="size-4" />
        ) : (
          <MoreHorizontal className="size-4" />
        )}
      </button>

      {isOpen &&
        coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.placeAbove ? undefined : `${coords.top}px`,
              bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
              left: `${coords.left}px`,
              zIndex: 9999,
            }}
            className={cn(
              'w-48 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/98 p-1.5 text-xs shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5',
              coords.placeAbove ? 'origin-bottom-right' : 'origin-top-right',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {visibleActions.map((action, idx) => {
              const isDisabled =
                typeof action.disabled === 'function' ? action.disabled(item) : action.disabled;
              const Icon = action.icon;
              const href = typeof action.href === 'function' ? action.href(item) : action.href;

              const isDanger = action.variant === 'danger';
              const isWarning = action.variant === 'warning';
              const isPrimary = action.variant === 'primary';

              const itemClass = cn(
                'group flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left font-semibold transition-all select-none',
                isDisabled
                  ? 'cursor-not-allowed opacity-40 text-slate-400'
                  : isDanger
                  ? 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                  : isWarning
                  ? 'text-amber-700 hover:bg-amber-50 hover:text-amber-800'
                  : isPrimary
                  ? 'text-[#00873E] hover:bg-emerald-50 hover:text-[#00873E]'
                  : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900',
              );

              const content = (
                <>
                  <span className="flex items-center gap-2 min-w-0">
                    {Icon ? (
                      <Icon
                        className={cn(
                          'size-3.5 shrink-0 transition-colors',
                          isDanger
                            ? 'text-rose-500'
                            : isWarning
                            ? 'text-amber-600'
                            : isPrimary
                            ? 'text-[#00873E]'
                            : 'text-slate-400 group-hover:text-slate-600',
                        )}
                      />
                    ) : null}
                    <span className="truncate">{action.label}</span>
                  </span>
                  {action.badge ? (
                    <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                      {action.badge}
                    </span>
                  ) : null}
                </>
              );

              return (
                <React.Fragment key={action.key || idx}>
                  {action.separatorBefore && (
                    <div className="my-1 border-t border-slate-100" />
                  )}
                  {href && !isDisabled ? (
                    <Link
                      href={href}
                      target={action.target}
                      rel={action.rel}
                      onClick={() => setIsOpen(false)}
                      className={itemClass}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={async () => {
                        if (isDisabled) return;
                        setIsOpen(false);
                        if (action.onClick) {
                          await action.onClick(item);
                        }
                      }}
                      className={itemClass}
                    >
                      {content}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

// ============================================================================
// Main CommonTable Component
// ============================================================================

export function CommonTable<T>({
  data,
  columns,
  rowKey,
  isLoading = false,
  isFetching = false,
  skeletonRows = 5,
  showIndexColumn = false,
  indexColumnHeader = 'STT',
  indexColumnWidth = 56,
  actions,
  actionHeaderTitle = 'Thao tác',
  actionColumnWidth = 76,
  actionColumnFixed = true,
  actionTriggerVariant = 'dots-h',
  actionTriggerLabel = 'Thao tác',
  emptyTitle = 'Chưa có dữ liệu',
  emptyDescription = 'Không tìm thấy bản ghi nào phù hợp với điều kiện hiển thị.',
  emptyIcon: EmptyIcon = Inbox,
  emptyAction,
  striped = false,
  hoverable = true,
  stickyHeader = true,
  compact = false,
  rounded = true,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  pagination,
  headerExtra,
  footerExtra,
  className,
  containerClassName,
}: CommonTableProps<T>) {
  // Prepended STT / Index Column
  const effectiveColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!showIndexColumn) return columns;

    const indexCol: ColumnDef<T> = {
      id: '__stt__',
      header: indexColumnHeader,
      width: indexColumnWidth,
      minWidth: 48,
      align: 'center',
      cell: (_item, index) => {
        const offset = pagination ? (pagination.page - 1) * pagination.pageSize : 0;
        return (
          <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums select-none">
            {offset + index + 1}
          </span>
        );
      },
    };

    return [indexCol, ...columns];
  }, [showIndexColumn, indexColumnHeader, indexColumnWidth, columns, pagination]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Extract key
  const getRowKey = useCallback(
    (item: T, index: number): string | number => {
      if (typeof rowKey === 'function') return rowKey(item, index);
      if (typeof rowKey === 'string' || typeof rowKey === 'number') {
        const val = (item as Record<string, unknown>)[rowKey as string];
        if (val !== undefined && val !== null) return String(val);
      }
      const candidate = (item as Record<string, unknown>)['id'];
      if (candidate !== undefined && candidate !== null) return String(candidate);
      return index;
    },
    [rowKey],
  );

  // Sorting handler
  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable || !onSort) return;
    if (sortColumn === col.id) {
      onSort(col.id, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(col.id, 'asc');
    }
  };

  const hasActions = Boolean(actions);

  return (
    <div className={cn('w-full space-y-3', containerClassName)}>
      {headerExtra ? <div className="w-full">{headerExtra}</div> : null}

      {/* Main Table Card */}
      <div
        className={cn(
          'relative border border-slate-200/80 bg-white shadow-xs transition-all',
          rounded ? 'rounded-2xl sm:rounded-3xl' : 'rounded-none',
          className,
        )}
      >
        {/* Subtle fetching indicator bar & floating spinner overlay */}
        {isFetching && !isLoading && (
          <>
            <div className="absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden bg-emerald-50">
              <div className="h-full w-full bg-gradient-to-r from-[#007234] via-emerald-400 to-[#00873E] animate-pulse" />
            </div>
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[0.5px] transition-all duration-200 pointer-events-none">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-md">
                <Loader2 className="size-3.5 animate-spin text-[#00873E]" />
                <span>Đang cập nhật dữ liệu…</span>
              </div>
            </div>
          </>
        )}

        {/* Horizontal Scroll Viewport */}
        <div
          ref={scrollContainerRef}
          className={cn(
            'w-full overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300',
            rounded ? 'rounded-2xl sm:rounded-3xl' : '',
          )}
        >
          <table className="w-full border-collapse text-left text-sm">
            {/* Header */}
            <thead
              className={cn(
                'border-b border-slate-100 text-[11px] font-bold tracking-wider text-slate-500 uppercase select-none',
                stickyHeader ? 'sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs' : 'bg-slate-50/80',
              )}
            >
              <tr>
                {effectiveColumns.map((col) => {
                  const isSorted = sortColumn === col.id;
                  const alignClass =
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                  return (
                    <th
                      key={col.id}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth,
                        maxWidth: col.maxWidth,
                      }}
                      className={cn(
                        compact ? 'px-3 py-2.5' : 'px-4 sm:px-5 py-3.5',
                        'whitespace-nowrap align-middle',
                        alignClass,
                        col.sortable && 'cursor-pointer hover:bg-slate-100/80 transition-colors',
                        col.sticky === 'left' && 'sticky left-0 z-10 bg-slate-50/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]',
                        col.headerClassName,
                      )}
                      onClick={() => handleHeaderClick(col)}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-1.5',
                          col.align === 'center' && 'justify-center',
                          col.align === 'right' && 'justify-end',
                        )}
                      >
                        <span className="truncate">
                          {typeof col.header === 'function'
                            ? col.header({ column: col })
                            : col.header}
                        </span>

                        {col.sortable && (
                          <span className="shrink-0 text-slate-400">
                            {isSorted ? (
                              sortDirection === 'asc' ? (
                                <ArrowUp className="size-3.5 text-[#00873E]" />
                              ) : (
                                <ArrowDown className="size-3.5 text-[#00873E]" />
                              )
                            ) : (
                              <ArrowUpDown className="size-3 opacity-60 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}

                {/* Fixed Sticky Action Column Header */}
                {hasActions && (
                  <th
                    style={{
                      width: actionColumnWidth,
                      minWidth: actionColumnWidth,
                    }}
                    className={cn(
                      compact ? 'px-3 py-2.5' : 'px-4 sm:px-5 py-3.5',
                      'whitespace-nowrap align-middle text-right font-bold text-slate-500 uppercase tracking-wider',
                      actionColumnFixed &&
                        'sticky right-0 z-20 bg-slate-50 border-l border-slate-200',
                    )}
                  >
                    <span className="truncate">{actionHeaderTitle}</span>
                  </th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody
              className={cn(
                'divide-y divide-slate-100 text-slate-700 transition-opacity duration-200',
                isFetching && !isLoading && 'opacity-50 pointer-events-none',
              )}
            >
              {/* Loading State */}
              {isLoading ? (
                Array.from({ length: skeletonRows }).map((_, rIdx) => (
                  <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                    {effectiveColumns.map((col) => (
                      <td
                        key={`skel-col-${col.id}`}
                        className={cn(compact ? 'px-3 py-3' : 'px-4 sm:px-5 py-3.5', 'align-middle')}
                      >
                        <div
                          className={cn(
                            'h-4 rounded-lg bg-slate-100',
                            col.align === 'center'
                              ? 'mx-auto w-1/2'
                              : col.align === 'right'
                              ? 'ml-auto w-2/3'
                              : 'w-3/4',
                          )}
                        />
                      </td>
                    ))}
                    {hasActions && (
                      <td
                        className={cn(
                          compact ? 'px-3 py-3' : 'px-4 sm:px-5 py-3.5',
                          'align-middle text-right',
                          actionColumnFixed &&
                            'sticky right-0 bg-white border-l border-slate-200/80',
                        )}
                      >
                        <div className="ml-auto size-7 rounded-lg bg-slate-100" />
                      </td>
                    )}
                  </tr>
                ))
              ) : data.length === 0 ? (
                /* Empty State Row */
                <tr>
                  <td
                    colSpan={effectiveColumns.length + (hasActions ? 1 : 0)}
                    className="p-12 text-center"
                  >
                    <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 shadow-2xs">
                      <EmptyIcon className="size-7 text-slate-400" />
                    </div>
                    <h4 className="mt-3.5 text-sm font-bold text-slate-800">{emptyTitle}</h4>
                    <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                      {emptyDescription}
                    </p>
                    {emptyAction ? <div className="mt-4">{emptyAction}</div> : null}
                  </td>
                </tr>
              ) : (
                /* Data Rows */
                data.map((item, index) => {
                  const key = getRowKey(item, index);
                  const isEven = index % 2 === 0;
                  const rowActions = actions ? actions(item, index) : [];

                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(item, index)}
                      className={cn(
                        'group transition-colors',
                        striped && !isEven && 'bg-slate-50/40',
                        hoverable && 'hover:bg-slate-50/80',
                        onRowClick && 'cursor-pointer',
                      )}
                    >
                      {effectiveColumns.map((col) => {
                        const alignClass =
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                            ? 'text-right'
                            : 'text-left';

                        return (
                          <td
                            key={`${key}-${col.id}`}
                            style={{
                              width: col.width,
                              minWidth: col.minWidth,
                              maxWidth: col.maxWidth,
                            }}
                            className={cn(
                              compact ? 'px-3 py-2.5' : 'px-4 sm:px-5 py-3.5',
                              'align-middle',
                              alignClass,
                              col.sticky === 'left' &&
                                'sticky left-0 z-5 bg-white group-hover:bg-slate-50/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors',
                              col.className,
                            )}
                          >
                            {col.cell
                              ? col.cell(item, index)
                              : col.accessorKey
                              ? String(item[col.accessorKey] ?? '—')
                              : '—'}
                          </td>
                        );
                      })}

                      {/* Fixed Sticky Action Column Cell */}
                      {hasActions && (
                        <td
                          style={{
                            width: actionColumnWidth,
                            minWidth: actionColumnWidth,
                          }}
                          className={cn(
                            compact ? 'px-3 py-2.5' : 'px-4 sm:px-5 py-3.5',
                            'align-middle text-right',
                            actionColumnFixed &&
                              'sticky right-0 z-10 bg-white group-hover:bg-slate-50 border-l border-slate-200/80 transition-colors',
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end">
                            <ActionDropdownMenu
                              item={item}
                              actions={rowActions}
                              variant={actionTriggerVariant}
                              label={actionTriggerLabel}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalItems > 0 && (
        <TablePagination pagination={pagination} />
      )}

      {footerExtra ? <div className="w-full">{footerExtra}</div> : null}
    </div>
  );
}

// ============================================================================
// Pagination Subcomponent
// ============================================================================

interface TablePaginationProps {
  pagination: TablePaginationConfig;
}

function TablePagination({ pagination }: TablePaginationProps) {
  const {
    page,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
  } = pagination;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = Math.min((page - 1) * pageSize + 1, totalItems);
  const endIndex = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-2xs sm:flex-row">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>
          Hiển thị <strong className="font-bold text-slate-800">{startIndex}</strong> -{' '}
          <strong className="font-bold text-slate-800">{endIndex}</strong> trong tổng số{' '}
          <strong className="font-extrabold text-slate-900">{totalItems.toLocaleString('vi-VN')}</strong> bản ghi
        </span>

        {onPageSizeChange && (
          <div className="hidden items-center gap-1.5 pl-3 border-l border-slate-200 md:flex">
            <SlidersHorizontal className="size-3 text-slate-400" />
            <span>Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Số bản ghi mỗi trang"
              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#00873E] focus:ring-1 focus:ring-[#00873E]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="size-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50 disabled:opacity-40"
          aria-label="Về trang đầu tiên"
          title="Trang đầu tiên"
        >
          <ChevronsLeft className="size-4 text-slate-600" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 gap-1 px-2.5 rounded-lg border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </Button>

        <div className="flex items-center px-2 text-xs font-bold text-slate-700">
          <span className="text-[#00873E]">{page}</span>
          <span className="mx-1 text-slate-400 font-normal">/</span>
          <span>{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 gap-1 px-2.5 rounded-lg border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="size-3.5" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="size-8 p-0 rounded-lg border-slate-200 hover:bg-slate-50 disabled:opacity-40"
          aria-label="Tới trang cuối cùng"
          title="Trang cuối cùng"
        >
          <ChevronsRight className="size-4 text-slate-600" />
        </Button>
      </div>
    </div>
  );
}
