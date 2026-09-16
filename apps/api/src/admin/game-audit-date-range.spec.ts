import { auditRangeEnd } from './game-audit-date-range';

describe('auditRangeEnd', () => {
  it('includes the full local day when the API receives a date-only to filter', () => {
    expect(auditRangeEnd('2026-09-16').toISOString()).toBe(new Date(2026, 8, 16, 23, 59, 59, 999).toISOString());
  });

  it('preserves explicit timestamps', () => {
    expect(auditRangeEnd('2026-09-16T10:30:00.000Z').toISOString()).toBe('2026-09-16T10:30:00.000Z');
  });
});
