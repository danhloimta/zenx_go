import { assertAssetUrl, assertContentMarkdown, assertCtaPath, normalizeSlug } from './content-markdown';

describe('content CMS validation', () => {
  it('normalizes Vietnamese titles into stable slugs', () => {
    expect(normalizeSlug('Bản cập nhật tháng 9')).toBe('ban-cap-nhat-thang-9');
  });

  it('rejects unsafe markup and links', () => {
    expect(() => assertContentMarkdown('<script>alert(1)</script>')).toThrow('Content');
    expect(() => assertContentMarkdown('[bad](javascript:alert(1))')).toThrow('http');
    expect(() => assertContentMarkdown('![image](https://example.com/a.png)')).toThrow('Content');
  });

  it('allows supported asset and CTA URL shapes only', () => {
    expect(() => assertAssetUrl('/images/games/hero.webp')).not.toThrow();
    expect(() => assertAssetUrl('https://cdn.example.com/hero.webp')).not.toThrow();
    expect(() => assertAssetUrl('javascript:alert(1)')).toThrow('Asset');
    expect(() => assertCtaPath('/tin-tuc')).not.toThrow();
    expect(() => assertCtaPath('https://example.com')).not.toThrow();
    expect(() => assertCtaPath('mailto:test@example.com')).toThrow('CTA');
  });
});
