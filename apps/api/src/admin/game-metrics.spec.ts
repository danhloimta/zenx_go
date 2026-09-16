import { vietnamCalendarStart } from './game-metrics';

describe('vietnamCalendarStart', () => {
  it('uses Asia/Ho_Chi_Minh midnight instead of a rolling 24-hour window', () => {
    expect(vietnamCalendarStart(new Date('2026-09-16T16:59:59.000Z'))).toEqual(new Date('2026-09-15T17:00:00.000Z'));
    expect(vietnamCalendarStart(new Date('2026-09-16T17:00:00.000Z'))).toEqual(new Date('2026-09-16T17:00:00.000Z'));
  });
});
