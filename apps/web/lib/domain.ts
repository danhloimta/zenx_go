import {
  isAllowedProtocol,
  normalizeBaseDomain,
  parseReturnTo,
  RESERVED_SUBDOMAINS,
} from '@zenx-go/web-domain';

export { RESERVED_SUBDOMAINS };

export function getPublicWebOrigin() {
  return process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? process.env.NEXT_PUBLIC_WEB_ORIGIN ?? 'http://lvh.me:3000';
}

export function getPublicBaseDomain() {
  const configured = process.env.PUBLIC_BASE_DOMAIN ?? process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (configured) return normalizeBaseDomain(configured);
  try { return normalizeBaseDomain(new URL(getPublicWebOrigin()).hostname); } catch { return 'lvh.me'; }
}

export function gameUrl(subdomain: string, pathname = '/') {
  const origin = new URL(getPublicWebOrigin());
  const baseDomain = getPublicBaseDomain();
  origin.hostname = `${subdomain.toLowerCase()}.${baseDomain}`;
  origin.pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  origin.search = '';
  origin.hash = '';
  return origin.toString().replace(/\/$/, pathname === '/' ? '/' : '');
}

export function portalUrl(pathname = '/') {
  const origin = new URL(getPublicWebOrigin());
  origin.pathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  origin.search = '';
  origin.hash = '';
  return origin.toString().replace(/\/$/, pathname === '/' ? '/' : '');
}

export function isSafeReturnTo(value: string | null | undefined) {
  if (!value) return false;
  const policy = { production: process.env.NODE_ENV === 'production', allowGameSubdomains: true, allowLocalHttp: true };
  if (!isAllowedProtocol(value, policy)) return false;
  const parsed = parseReturnTo(value, getPublicBaseDomain(), [], policy);
  if (!parsed) return false;
  try {
    const configured = new URL(getPublicWebOrigin());
    return parsed.url.protocol === configured.protocol && parsed.url.port === configured.port;
  } catch {
    return false;
  }
}
