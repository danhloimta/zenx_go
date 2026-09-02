export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'admin', 'id', 'auth', 'account', 'support', 'cdn', 'static', 'assets', 'status',
]);

export type WebHostKind = 'ROOT' | 'WWW' | 'GAME' | 'RESERVED' | 'UNKNOWN';

export type ClassifiedWebHost = {
  kind: WebHostKind;
  subdomain?: string;
};

export type OriginPolicy = {
  production?: boolean;
  allowGameSubdomains?: boolean;
  allowLocalHttp?: boolean;
};

export function normalizeHostname(value: string | undefined | null): string {
  const raw = (value ?? '').trim().toLowerCase().replace(/\.$/, '');
  if (!raw) return '';
  if (raw.includes('://')) {
    try {
      return normalizeHostname(new URL(raw).hostname);
    } catch {
      return '';
    }
  }
  if (raw.startsWith('[')) {
    const closing = raw.indexOf(']');
    return closing >= 0 ? raw.slice(1, closing) : raw;
  }
  return raw.split(':')[0] ?? '';
}

export function normalizeBaseDomain(value: string | undefined | null): string {
  return normalizeHostname(value);
}

export function classifyWebHost(host: string | undefined | null, baseDomain: string): ClassifiedWebHost {
  const normalizedHost = normalizeHostname(host);
  const base = normalizeBaseDomain(baseDomain);
  if (!normalizedHost || !base) return { kind: 'UNKNOWN' };
  if (normalizedHost === base) return { kind: 'ROOT' };
  if (normalizedHost === `www.${base}`) return { kind: 'WWW', subdomain: 'www' };

  const suffix = `.${base}`;
  if (!normalizedHost.endsWith(suffix)) return { kind: 'UNKNOWN' };
  const label = normalizedHost.slice(0, -suffix.length);
  if (!label || label.includes('.')) return { kind: 'UNKNOWN' };
  if (RESERVED_SUBDOMAINS.has(label)) return { kind: 'RESERVED', subdomain: label };
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) return { kind: 'UNKNOWN' };
  return { kind: 'GAME', subdomain: label };
}

export function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function isAllowedProtocol(value: string, policy: OriginPolicy = {}): boolean {
  try {
    const url = new URL(value);
    const hostname = normalizeHostname(url.hostname);
    const localHost = hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === 'lvh.me' || hostname.endsWith('.lvh.me') || hostname === '127.0.0.1' || hostname === '::1';
    return policy.production && !(policy.allowLocalHttp && localHost)
      ? url.protocol === 'https:'
      : url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isAllowedOriginShape(
  origin: string | undefined | null,
  baseDomain: string,
  explicitOrigins: string[] = [],
  policy: OriginPolicy = {},
): ClassifiedWebHost | null {
  if (!origin) return null;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return null;
  }
  if (!isAllowedProtocol(origin, policy) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;

  const normalizedOrigin = normalizeOrigin(origin);
  const host = classifyWebHost(url.hostname, baseDomain);
  if (!normalizedOrigin || host.kind === 'UNKNOWN' || host.kind === 'RESERVED') return null;
  if (host.kind === 'GAME' && policy.allowGameSubdomains === false) return null;

  const explicitlyAllowed = explicitOrigins.some((allowed) => normalizeOrigin(allowed) === normalizedOrigin);
  if (explicitlyAllowed) return host;
  return host.kind === 'ROOT' || host.kind === 'WWW' || (host.kind === 'GAME' && policy.allowGameSubdomains !== false) ? host : null;
}

export type ReturnToParts = {
  url: URL;
  host: ClassifiedWebHost;
};

export function parseReturnTo(
  value: string | undefined | null,
  baseDomain: string,
  explicitOrigins: string[] = [],
  policy: OriginPolicy = {},
): ReturnToParts | null {
  if (!value || value.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (!isAllowedProtocol(value, policy) || url.username || url.password || url.hash || !url.pathname.startsWith('/') || url.pathname.startsWith('//')) return null;

  const host = classifyWebHost(url.hostname, baseDomain);
  if (host.kind === 'UNKNOWN' || host.kind === 'RESERVED') return null;
  const origin = normalizeOrigin(url.origin);
  if (!origin) return null;
  const originAllowed = explicitOrigins.length === 0
    ? true
    : explicitOrigins.some((allowed) => normalizeOrigin(allowed) === origin);
  if (!originAllowed && host.kind !== 'ROOT' && host.kind !== 'WWW' && !(host.kind === 'GAME' && policy.allowGameSubdomains !== false)) return null;
  if (host.kind === 'GAME' && policy.allowGameSubdomains === false) return null;
  return { url, host };
}
