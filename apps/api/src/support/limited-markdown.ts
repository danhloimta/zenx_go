import { DomainError, ErrorCode } from '../common/errors';

const LINK_PATTERN =
  /\[[^\]]*\]\(\s*(?:<([^>\n]+)>|([^)\s]+))(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;

/**
 * FAQ content is intentionally a small Markdown subset. Rendering is also
 * configured without raw HTML on the web side, but rejecting unsupported
 * constructs at the API boundary keeps stored content predictable.
 */
export function assertLimitedMarkdown(value: string) {
  if (
    /<\/?[a-z][^>]*>/iu.test(value) ||
    /<!--[\s\S]*?-->/u.test(value) ||
    /!\[[^\]]*\]/u.test(value) ||
    /^\s*#{1,6}\s/mu.test(value) ||
    /^\s*\|/mu.test(value) ||
    /^\s*(`{3,}|~{3,})/mu.test(value) ||
    /^\s*>/mu.test(value) ||
    /^\s*(?:[-*_]\s*){3,}$/mu.test(value) ||
    /^\s*(?:=+|-+)\s*$/mu.test(value) ||
    /^\s*:?-{3,}:?(?:\s*\|\s*:?-{3,}:?)+\s*$/mu.test(value)
  ) {
    throw new DomainError(
      ErrorCode.SUPPORT_INVALID_MARKDOWN,
      'FAQ content contains unsupported Markdown',
      400,
    );
  }
  for (const match of value.matchAll(LINK_PATTERN)) {
    const href = match[1] ?? match[2];
    if (!href)
      throw new DomainError(
        ErrorCode.SUPPORT_INVALID_MARKDOWN,
        'FAQ links must use http or https',
        400,
      );
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      throw new DomainError(
        ErrorCode.SUPPORT_INVALID_MARKDOWN,
        'FAQ links must use http or https',
        400,
      );
    }
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new DomainError(
        ErrorCode.SUPPORT_INVALID_MARKDOWN,
        'FAQ links must use http or https',
        400,
      );
    }
  }
  return value;
}
