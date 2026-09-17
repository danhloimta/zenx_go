'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Context & Hook
// ============================================================================

interface NavigationLoadingContextValue {
  isNavigating: boolean;
  navigatingHref: string | null;
  startNavigation: (href?: string) => void;
  stopNavigation: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextValue>({
  isNavigating: false,
  navigatingHref: null,
  startNavigation: () => {},
  stopNavigation: () => {},
});

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}

// ============================================================================
// Navigation Events Detector (wrapped in Suspense for Next.js App Router)
// ============================================================================

interface NavigationWatcherProps {
  onRouteChanged: () => void;
  onLinkClick: (href: string) => void;
}

function NavigationWatcher({ onRouteChanged, onLinkClick }: NavigationWatcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Route change completed
  useEffect(() => {
    onRouteChanged();
  }, [pathname, searchParams, onRouteChanged]);

  // Intercept internal link clicks for 0ms immediate feedback
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Find closest anchor
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Ignore non-navigation links
      if (
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      // Ignore modified clicks (open in new tab/window)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (target.getAttribute('target') === '_blank') return;
      if (target.hasAttribute('download')) return;

      try {
        const nextUrl = new URL(href, window.location.href);
        const currentUrl = new URL(window.location.href);

        // Same origin navigation check
        if (nextUrl.origin === currentUrl.origin) {
          // If going to a different route or query
          if (
            nextUrl.pathname !== currentUrl.pathname ||
            nextUrl.search !== currentUrl.search
          ) {
            onLinkClick(href);
          }
        }
      } catch {
        // Ignore malformed URLs
      }
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [onLinkClick]);

  return null;
}

// ============================================================================
// Provider
// ============================================================================

export function NavigationLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = useCallback((href?: string) => {
    setIsNavigating(true);
    if (href) setNavigatingHref(href);

    // Clear any previous safety timer
    if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

    // Failsafe auto-reset after 6s in case navigation is cancelled
    safetyTimeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      setNavigatingHref(null);
    }, 6000);
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setNavigatingHref(null);
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  }, []);

  return (
    <NavigationLoadingContext.Provider
      value={{
        isNavigating,
        navigatingHref,
        startNavigation,
        stopNavigation,
      }}
    >
      <Suspense fallback={null}>
        <NavigationWatcher
          onRouteChanged={stopNavigation}
          onLinkClick={startNavigation}
        />
      </Suspense>
      {children}
    </NavigationLoadingContext.Provider>
  );
}

// ============================================================================
// Top Progress Bar
// ============================================================================

export function GlobalProgressBar() {
  const { isNavigating } = useNavigationLoading();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isQueryActive = isFetching > 0 || isMutating > 0;
  const isActive = isNavigating || isQueryActive;

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  };

  useEffect(() => {
    clearTimers();

    if (isActive) {
      setVisible(true);
      setProgress(20);

      // Step progression
      const t1 = setTimeout(() => setProgress(50), 200);
      const t2 = setTimeout(() => setProgress(75), 500);
      const t3 = setTimeout(() => setProgress(90), 1200);

      timerRef.current = [t1, t2, t3];
    } else if (visible) {
      // Complete and fade out
      setProgress(100);
      const tFade = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
      timerRef.current = [tFade];
    }

    return () => clearTimers();
  }, [isActive]);

  if (!visible && !isActive) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[99999] h-[2.5px] pointer-events-none overflow-hidden"
      >
        <div
          className={cn(
            'h-full bg-gradient-to-r from-[#007234] via-[#00873E] to-emerald-400 transition-all shadow-[0_0_8px_rgba(0,135,62,0.6)]',
            progress === 100
              ? 'duration-200 ease-out opacity-0'
              : 'duration-300 ease-out opacity-100',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <GlobalCenterSpinner />
    </>
  );
}

// ============================================================================
// Center-Screen Loading Spinner Overlay
// ============================================================================

export function GlobalCenterSpinner() {
  const { isNavigating } = useNavigationLoading();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isQueryActive = isFetching > 0 || isMutating > 0;
  const isLoading = isNavigating || isQueryActive;

  if (!isLoading) return null;

  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[99998] flex items-center justify-center pointer-events-none transition-all duration-200"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl border border-emerald-200/80 bg-white/95 text-[#00873E] shadow-2xl shadow-slate-900/15 backdrop-blur-md transition-all duration-200 animate-in fade-in zoom-in-90">
        <Loader2 className="size-6 animate-spin text-[#00873E]" />
      </div>
    </div>
  );
}

// ============================================================================
// Common Spinning Loading Badge Component (Icon only)
// ============================================================================

export interface CommonLoadingBadgeProps {
  className?: string;
  showAlways?: boolean;
}

export function CommonLoadingBadge({
  className,
  showAlways = false,
}: CommonLoadingBadgeProps) {
  const { isNavigating } = useNavigationLoading();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isQueryActive = isFetching > 0 || isMutating > 0;
  const isLoading = showAlways || isNavigating || isQueryActive;

  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/80 text-[#00873E] shadow-2xs backdrop-blur-xs transition-all animate-in fade-in zoom-in-95 duration-200',
        className,
      )}
      title="Đang tải dữ liệu…"
    >
      <Loader2 className="size-4 animate-spin text-[#00873E] shrink-0" />
    </div>
  );
}
