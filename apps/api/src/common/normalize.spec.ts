import { normalizeEmail, normalizePhone, normalizeUsername } from './normalize';

describe('identity normalization', () => {
  it('normalizes username and email case/whitespace', () => {
    expect(normalizeUsername('  ZENPlayer  ')).toBe('zenplayer');
    expect(normalizeEmail(' Player@Example.COM ')).toBe('player@example.com');
  });

  it('normalizes Vietnamese phone formats to E.164', () => {
    expect(normalizePhone('090 123 4567')).toBe('+84901234567');
    expect(normalizePhone('0084901234567')).toBe('+84901234567');
  });
});
