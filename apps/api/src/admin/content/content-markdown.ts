import { DomainError, ErrorCode } from '../../common/errors';

const LINK_PATTERN =
  /\[[^\]]*\]\(\s*(?:<([^>\n]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;

/**
 * Game and portal content uses a deliberately small Markdown subset. The
 * existing renderer escapes HTML, but rejecting it at the write boundary
 * keeps stored content predictable and prevents unsafe links from entering
 * the CMS.
 */
export function assertContentMarkdown(value: string) {
  if (
    /<\/?[a-z][^>]*>/iu.test(value) ||
    /<!--[\s\S]*?-->/u.test(value) ||
    /!\[[^\]]*\]/u.test(value)
  ) {
    throw new DomainError(
      ErrorCode.CONTENT_INVALID_STATE,
      'Content contains unsupported HTML or image markup',
      400,
    );
  }
  for (const match of value.matchAll(LINK_PATTERN)) {
    const href = match[1] ?? match[2];
    if (!href)
      throw new DomainError(
        ErrorCode.CONTENT_INVALID_URL,
        'Content links must use http or https',
        400,
      );
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      throw new DomainError(
        ErrorCode.CONTENT_INVALID_URL,
        'Content links must use http or https',
        400,
      );
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new DomainError(
        ErrorCode.CONTENT_INVALID_URL,
        'Content links must use http or https',
        400,
      );
    }
  }
  return value;
}

export function normalizeSlug(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  if (!slug || slug.length > 180) {
    throw new DomainError(ErrorCode.CONTENT_INVALID_STATE, 'Content slug is invalid', 400);
  }
  return slug;
}

export function assertAssetUrl(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') return;
  if (isHttpUrl(value) || value.startsWith('/images/') || value.startsWith('/uploads/')) {
    return;
  }
  throw new DomainError(
    ErrorCode.CONTENT_INVALID_URL,
    'Asset URL must be /images, /uploads, http or https',
    400,
  );
}

export function assertCtaPath(value: string | null | undefined) {
  if (value === null || value === undefined || value === '') return;
  if ((value.startsWith('/') && !value.startsWith('//')) || isHttpUrl(value)) return;
  throw new DomainError(
    ErrorCode.CONTENT_INVALID_URL,
    'CTA path must be an internal path, http or https',
    400,
  );
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}
