import {
  classifyWebHost,
  isAllowedOriginShape,
  normalizeHostname,
  parseReturnTo,
  RESERVED_SUBDOMAINS,
} from '@zenx-go/web-domain';

export { classifyWebHost, normalizeHostname, RESERVED_SUBDOMAINS };
export type { ClassifiedWebHost, OriginPolicy, ReturnToParts, WebHostKind } from '@zenx-go/web-domain';

export function isAllowedWebOrigin(
  origin: string | undefined | null,
  baseDomain: string,
  explicitOrigins: string[] = [],
  allowGameSubdomains = true,
  production = process.env.NODE_ENV === 'production',
) {
  return Boolean(isAllowedOriginShape(origin, baseDomain, explicitOrigins, { allowGameSubdomains, production }));
}

export function isAllowedReturnTo(
  value: string | undefined | null,
  baseDomain: string,
  explicitOrigins: string[] = [],
  allowGameSubdomains = true,
  production = process.env.NODE_ENV === 'production',
) {
  return Boolean(parseReturnTo(value, baseDomain, explicitOrigins, { allowGameSubdomains, production }));
}
