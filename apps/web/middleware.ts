import { NextRequest, NextResponse } from 'next/server';
import { classifyWebHost, normalizeBaseDomain, normalizeHostname } from '@zenx-go/web-domain';

function baseDomain() {
  const configured = process.env.PUBLIC_BASE_DOMAIN ?? process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (configured) return normalizeBaseDomain(configured);
  try { return normalizeBaseDomain(new URL(process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? 'http://lvh.me:3000').hostname); } catch { return 'lvh.me'; }
}

function apiBaseUrl() {
  const configured = process.env.API_PROXY_ORIGIN ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured, 'http://zenx-go.local');
    if (url.origin === 'http://zenx-go.local') return null;
    return url.pathname.replace(/\/$/, '').endsWith('/api/v1')
      ? `${url.origin}${url.pathname.replace(/\/$/, '')}`
      : `${url.origin}/api/v1`;
  } catch {
    return null;
  }
}

async function isPublicGameSubdomain(subdomain: string) {
  const baseUrl = apiBaseUrl();
  if (!baseUrl) return false;
  try {
    const response = await fetch(`${baseUrl}/games/by-subdomain/${encodeURIComponent(subdomain)}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
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
    return new NextResponse('Not Found', { status: 404 });
  }

  // Validate against the database so newly edited public subdomains work immediately,
  // while unknown/private subdomains still return a real 404 from the edge.
  if (!(await isPublicGameSubdomain(host.subdomain ?? ''))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Distribution URLs are intentionally disabled until a real installer or play URL is configured.
  // Returning the status here avoids a 200 response from a notFound() thrown after an internal rewrite.
  if (pathname === '/tai-game' || pathname.startsWith('/tai-game/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const internalPath = `/game-site/${host.subdomain}${pathname === '/' ? '' : pathname}`;
  const target = new URL(internalPath, request.url);
  target.search = request.nextUrl.search;
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
