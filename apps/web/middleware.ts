import { NextRequest, NextResponse } from 'next/server';

const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin', 'id', 'auth', 'account', 'support', 'cdn', 'static', 'assets', 'status']);
function baseDomain() {
  const configured = process.env.PUBLIC_BASE_DOMAIN ?? process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (configured) return configured.toLowerCase().replace(/^\.+|\.+$/g, '');
  try { return new URL(process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? 'http://localhost:3000').hostname.toLowerCase(); } catch { return 'localhost'; }
}

function classify(host: string, base: string) {
  const hostname = host.toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  if (hostname === base) return { kind: 'ROOT' as const };
  if (hostname === `www.${base}`) return { kind: 'WWW' as const };
  const suffix = `.${base}`;
  if (!hostname.endsWith(suffix)) return { kind: 'UNKNOWN' as const };
  const label = hostname.slice(0, -suffix.length);
  if (!label || label.includes('.')) return { kind: 'UNKNOWN' as const };
  if (RESERVED_SUBDOMAINS.has(label)) return { kind: 'RESERVED' as const, subdomain: label };
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return { kind: 'UNKNOWN' as const };
  return { kind: 'GAME' as const, subdomain: label };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/_')) return NextResponse.next();

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = classify(forwardedHost ?? request.headers.get('host') ?? request.nextUrl.host, baseDomain());
  if (pathname.startsWith('/game-site')) {
    return host.kind === 'GAME' ? NextResponse.next() : NextResponse.rewrite(new URL('/_host-error', request.url));
  }
  if (host.kind === 'ROOT') return NextResponse.next();
  if (host.kind === 'WWW') return NextResponse.next();
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
