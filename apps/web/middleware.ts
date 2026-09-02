import { NextRequest, NextResponse } from 'next/server';
import { classifyWebHost, normalizeBaseDomain, normalizeHostname } from '@zenx-go/web-domain';

function baseDomain() {
  const configured = process.env.PUBLIC_BASE_DOMAIN ?? process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (configured) return normalizeBaseDomain(configured);
  try { return normalizeBaseDomain(new URL(process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? 'http://lvh.me:3000').hostname); } catch { return 'lvh.me'; }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/_')) return NextResponse.next();

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const requestHost = forwardedHost ?? request.headers.get('host') ?? request.nextUrl.host;
  const host = classifyWebHost(requestHost, baseDomain());
  const localhostPortalAlias = process.env.NODE_ENV !== 'production' && normalizeHostname(requestHost) === 'localhost';
  if (pathname.startsWith('/game-site')) {
    return host.kind === 'GAME' ? NextResponse.next() : NextResponse.rewrite(new URL('/_host-error', request.url));
  }
  if (host.kind === 'ROOT' || localhostPortalAlias) return NextResponse.next();
  if (host.kind === 'WWW') {
    const canonical = request.nextUrl.clone();
    canonical.hostname = baseDomain();
    return NextResponse.redirect(canonical);
  }
  if (host.kind !== 'GAME') {
    return NextResponse.rewrite(new URL('/_host-error', request.url));
  }

  const internalPath = `/game-site/${host.subdomain}${pathname === '/' ? '' : pathname}`;
  const target = new URL(internalPath, request.url);
  target.search = request.nextUrl.search;
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
