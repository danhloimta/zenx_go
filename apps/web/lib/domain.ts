export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'id', 'auth', 'account', 'support', 'cdn', 'static', 'assets', 'status',
]);

export function getPublicWebOrigin() {
  return process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? process.env.NEXT_PUBLIC_WEB_ORIGIN ?? 'http://localhost:3000';
}

export function getPublicBaseDomain() {
  const configured = process.env.PUBLIC_BASE_DOMAIN ?? process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (configured) return configured.toLowerCase().replace(/^\.+|\.+$/g, '');
  try { return new URL(getPublicWebOrigin()).hostname.toLowerCase(); } catch { return 'localhost'; }
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
  try {
    const url = new URL(value);
    const base = getPublicBaseDomain();
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) return false;
    if (url.hostname !== base && !url.hostname.endsWith(`.${base}`)) return false;
    const label = url.hostname.slice(0, -(base.length + 1));
    return !label.includes('.') && (!label || !RESERVED_SUBDOMAINS.has(label));
  } catch { return false; }
}
