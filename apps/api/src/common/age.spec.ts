import { isAtLeastAge } from './age';

describe('isAtLeastAge', () => {
  const today = new Date('2026-09-16T12:00:00.000Z');

  it('accepts someone exactly 18 today', () => {
    expect(isAtLeastAge('2008-09-16', 18, today)).toBe(true);
  });

  it('rejects someone whose 18th birthday is tomorrow', () => {
    expect(isAtLeastAge('2008-09-17', 18, today)).toBe(false);
  });
});
