'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ExternalLink,
  Gamepad2,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAdminContentGames } from '@/hooks/use-content';
import { gameAdminUrl } from '@/lib/domain';
import { mediaUrl, cn } from '@/lib/utils';

export interface GameSwitcherProps {
  className?: string;
  variant?: 'header' | 'menu';
}

export function GameSwitcher({ className, variant = 'header' }: GameSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const gamesQuery = useAdminContentGames({ page: 1, pageSize: 50 });
  const items = gamesQuery.data?.items ?? [];

  const filteredGames = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q) ||
        g.subdomain?.toLowerCase().includes(q),
    );
  }, [items, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  if (variant === 'menu') {
    return (
      <div className="space-y-1" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold transition-colors',
            open
              ? 'bg-emerald-50 text-[#00873E]'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
            className,
          )}
        >
          <span className="flex items-center gap-2">
            <Gamepad2 className="size-4 text-[#00873E]" />
            Quản trị Game ({items.length})
          </span>
          <ChevronDown
            className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
          />
        </button>

        {open && (
          <div className="mt-1 space-y-1 rounded-xl border border-slate-100 bg-slate-50/80 p-1.5 animate-in fade-in zoom-in-95 duration-100">
            {items.map((game) => (
              <a
                key={game.id}
                href={gameAdminUrl(game.subdomain)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg p-2 text-xs font-semibold text-slate-700 hover:bg-white hover:text-[#00873E] hover:shadow-2xs transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative size-6 shrink-0 overflow-hidden rounded-lg bg-emerald-100/60 text-[#00873E] flex items-center justify-center">
                    {game.iconUrl ? (
                      <img src={mediaUrl(game.iconUrl)} alt={game.name} className="size-full object-cover" />
                    ) : (
                      <Gamepad2 className="size-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 leading-tight">{game.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{game.code}</p>
                  </div>
                </div>
                <ExternalLink className="size-3 text-slate-400 shrink-0 ml-1" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all shadow-2xs',
          open
            ? 'border-[#00873E] bg-[#E8F7EC] text-[#00873E] ring-2 ring-[#00873E]/10'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        )}
        aria-expanded={open}
        aria-label="Menu chuyển đổi quản trị game"
      >
        <Gamepad2 className="size-4 text-[#00873E]" />
        <span className="hidden sm:inline">Quản trị Game</span>
        {items.length > 0 && (
          <span className="rounded-full bg-[#00873E]/10 px-1.5 py-0.2 text-[10px] font-extrabold text-[#00873E]">
            {items.length}
          </span>
        )}
        <ChevronDown
          className={cn(
            'size-3.5 text-slate-400 transition-transform duration-200',
            open && 'rotate-180 text-slate-700',
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 px-1">
            <div>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Gamepad2 className="size-3.5 text-[#00873E]" /> Chọn Game để quản trị
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Mở portal quản trị chuyên biệt từng tựa game
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-[#00873E]">
              {items.length} Game
            </span>
          </div>

          {/* Search Box */}
          {items.length > 3 && (
            <div className="relative my-2.5">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm game theo tên, mã code..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00873E] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00873E]"
              />
            </div>
          )}

          {/* Game List */}
          <div className="mt-1 max-h-64 space-y-1 overflow-y-auto pr-0.5">
            {filteredGames.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Không tìm thấy tựa game phù hợp
              </div>
            ) : (
              filteredGames.map((game) => (
                <a
                  key={game.id}
                  href={gameAdminUrl(game.subdomain)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between rounded-xl p-2 transition-all hover:bg-[#E8F7EC]/40 border border-transparent hover:border-emerald-200/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 flex items-center justify-center shadow-2xs">
                      {game.iconUrl || game.coverUrl ? (
                        <img
                          src={mediaUrl(game.iconUrl || game.coverUrl || '')}
                          alt={game.name}
                          className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <Gamepad2 className="size-5 text-[#00873E]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-bold text-slate-900 group-hover:text-[#00873E]">
                          {game.name}
                        </span>
                        {game.primaryGame && (
                          <span className="rounded bg-amber-50 px-1 py-0.2 text-[9px] font-bold text-amber-700">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                          {game.code}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {game.subdomain}.zenx.vn
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#00873E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 text-[11px] font-semibold">
                    <span>Vào admin</span>
                    <ExternalLink className="size-3" />
                  </div>
                </a>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-2.5 border-t border-slate-100 pt-2 flex items-center justify-between text-[11px]">
            <Link
              href="/admin/content/games"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-[#00873E] font-medium transition-colors"
            >
              <Layers className="size-3.5" />
              <span>Quản lý Catalog Game</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
