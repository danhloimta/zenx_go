import { assertLimitedMarkdown } from './limited-markdown';

describe('limited FAQ Markdown', () => {
  it('accepts the supported inline formatting and safe links', () => {
    expect(
      assertLimitedMarkdown('Dùng **in đậm**, *in nghiêng* và [trang chủ](https://example.com).'),
    ).toContain('**in đậm**');
  });

  it.each([
    '<script>alert(1)</script>',
    '# Heading',
    '| a | b |',
    '![image](https://example.com/a.png)',
    '![image][image-ref]\n\n[image-ref]: https://example.com/a.png',
    '<!-- comment -->',
    '[bad](javascript:alert(1))',
    '```js\nalert(1)\n```',
    '> internal quote',
    'Title\n-----',
    '[bad](<javascript:alert(1)>)',
  ])('rejects unsupported or unsafe Markdown: %s', (value) => {
    expect(() => assertLimitedMarkdown(value)).toThrow('FAQ');
  });
});
