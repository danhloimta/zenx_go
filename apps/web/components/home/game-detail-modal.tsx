'use client';

import { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Bot, 
  Calendar, 
  CheckCircle2, 
  Crosshair, 
  Crown, 
  Flame, 
  Gift, 
  Globe, 
  Heart, 
  Monitor, 
  Shield, 
  Smartphone, 
  Smile, 
  Sparkles, 
  Sun, 
  Swords, 
  X, 
  Zap 
} from 'lucide-react';
import { GameItem } from '@/lib/games-data';
import { Button } from '@/components/ui/button';

interface GameDetailModalProps {
  game: GameItem | null;
  onClose: () => void;
}

export function GameDetailModal({ game, onClose }: GameDetailModalProps) {
  const [registered, setRegistered] = useState(false);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (game) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [game, onClose]);

  if (!game) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Swords': return <Swords className="size-4 text-[#00873E]" />;
      case 'Shield': return <Shield className="size-4 text-[#00873E]" />;
      case 'Zap': return <Zap className="size-4 text-[#00873E]" />;
      case 'Flame': return <Flame className="size-4 text-amber-500" />;
      case 'Crown': return <Crown className="size-4 text-amber-500" />;
      case 'Heart': return <Heart className="size-4 text-sky-500" />;
      case 'Sun': return <Sun className="size-4 text-sky-500" />;
      case 'Smile': return <Smile className="size-4 text-sky-500" />;
      case 'Crosshair': return <Crosshair className="size-4 text-purple-400" />;
      case 'Bot': return <Bot className="size-4 text-purple-400" />;
      default: return <Sparkles className="size-4 text-[#00873E]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-950 border border-slate-800 text-white shadow-2xl z-10 scrollbar-none animate-in zoom-in-95 duration-200">
        {/* Cover Banner */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden">
          <img
            src={game.assets.heroDesktop}
            alt={game.alt}
            className="size-full object-cover object-center"
            style={{ objectPosition: game.focalPoint || 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/60 text-slate-300 hover:text-white hover:bg-black/90 backdrop-blur-md transition-all border border-white/10 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="size-5" />
          </button>

          {/* Category & Status Overlay */}
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-[#00873E] text-white shadow-md">
                {game.categoryDisplay}
              </span>
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900/90 text-slate-200 border border-slate-700/80 backdrop-blur-md">
                {game.status}
              </span>
            </div>

            {game.releaseTarget && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900/90 text-slate-300 border border-slate-700/80 backdrop-blur-md">
                <Calendar className="size-3.5 text-slate-400" />
                {game.releaseTarget}
              </span>
            )}
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Slogan */}
          <div>
            <h3 className="font-game-title text-2xl sm:text-3xl font-bold text-white tracking-wide uppercase">
              {game.title}
            </h3>
            <p className="mt-1 text-sm font-medium text-emerald-400">
              {game.slogan}
            </p>
          </div>

          {/* Lore Synopsis */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Cốt truyện & Bối cảnh
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {game.synopsis}
            </p>
          </div>

          {/* Key Features */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Đặc điểm gameplay nổi bật
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {game.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {renderIcon(feat.icon)}
                    <p className="text-xs font-bold text-slate-200 leading-tight">
                      {feat.title}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400">
            <span className="font-bold text-slate-300">Nền tảng hỗ trợ:</span>
            <div className="flex items-center gap-2">
              {game.platforms.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 font-semibold text-[11px]"
                >
                  {p === 'PC' && <Monitor className="size-3 text-slate-400" />}
                  {p === 'Mobile' && <Smartphone className="size-3 text-slate-400" />}
                  {p === 'Web' && <Globe className="size-3 text-slate-400" />}
                  <span>{p}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Pre-Register Reward Box */}
          {game.preRegisterReward && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/30 border border-emerald-500/30 flex items-center gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                <Gift className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                  Quà đăng ký sớm (Pre-register)
                </p>
                <p className="text-xs font-bold text-slate-200 truncate">
                  {game.preRegisterReward}
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto h-11 px-5 rounded-2xl bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Đóng
            </Button>

            {registered ? (
              <div className="w-full sm:w-auto flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-bold shadow-lg">
                <CheckCircle2 className="size-4" />
                <span>Đã đăng ký nhận thông báo!</span>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setRegistered(true)}
                className="w-full sm:w-auto h-11 px-7 rounded-2xl bg-[#00873E] hover:bg-[#007335] text-white font-bold text-xs shadow-xl shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Đăng ký nhận thông báo sớm</span>
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
