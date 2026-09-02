export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'id', 'auth', 'account', 'support', 'cdn', 'static', 'assets', 'status',
]);

export type WebHostKind = 'ROOT' | 'WWW' | 'GAME' | 'RESERVED' | 'UNKNOWN';

export function normalizeHostname(value: string | undefined | null): string {
  const raw = (value ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (!raw) return '';
  if (raw.includes('://')) {
    try { return new URL(raw).hostname.toLowerCase().replace(/\.$/, ''); } catch { return ''; }
  }
  if (raw.startsWith('[')) {
    const closing = raw.indexOf(']');
    return closing >= 0 ? raw.slice(1, closing) : raw;
  }
  return raw.split(':')[0] ?? '';
}

export function classifyWebHost(host: string | undefined | null, baseDomain: string): { kind: WebHostKind; subdomain?: string } {
  const normalizedHost = normalizeHostname(host);
  const base = normalizeHostname(baseDomain);
  if (!normalizedHost || !base) return { kind: 'UNKNOWN' };
  if (normalizedHost === base) return { kind: 'ROOT' };
  if (normalizedHost === `www.${base}`) return { kind: 'WWW' };
  const suffix = `.${base}`;
  if (!normalizedHost.endsWith(suffix)) return { kind: 'UNKNOWN' };
  const label = normalizedHost.slice(0, -suffix.length);
  if (!label || label.includes('.')) return { kind: 'UNKNOWN' };
  if (RESERVED_SUBDOMAINS.has(label)) return { kind: 'RESERVED', subdomain: label };
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return { kind: 'UNKNOWN' };
  return { kind: 'GAME', subdomain: label };
}

export function isAllowedWebOrigin(origin: string | undefined | null, baseDomain: string, explicitOrigins: string[] = [], allowGameSubdomains = true): boolean {
  if (!origin) return true;
  let url: URL;
  try { url = new URL(origin); } catch { return false; }
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  const normalizedOrigin = `${url.protocol}//${normalizeHostname(url.hostname)}${url.port ? `:${url.port}` : ''}`;
  const host = classifyWebHost(url.hostname, baseDomain);
  if (host.kind === 'GAME' && !allowGameSubdomains) return false;
  if (explicitOrigins.some((allowed) => {
    try {
      const candidate = new URL(allowed);
      return `${candidate.protocol}//${normalizeHostname(candidate.hostname)}${candidate.port ? `:${candidate.port}` : ''}` === normalizedOrigin;
    } catch { return false; }
  })) return true;
  return host.kind === 'ROOT' || host.kind === 'WWW' || (allowGameSubdomains && host.kind === 'GAME');
}

export function isAllowedReturnTo(value: string | undefined | null, baseDomain: string, explicitOrigins: string[] = [], allowGameSubdomains = true): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) return false;
    return isAllowedWebOrigin(url.origin, baseDomain, explicitOrigins, allowGameSubdomains) && url.pathname.startsWith('/') && !url.pathname.startsWith('//');
  } catch { return false; }
}
