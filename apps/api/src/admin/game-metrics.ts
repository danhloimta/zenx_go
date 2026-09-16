const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export function vietnamCalendarStart(value: Date) {
  const local = new Date(value.getTime() + VIETNAM_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - VIETNAM_OFFSET_MS);
}

export function vietnamDaysAgoStart(value: Date, days: number) {
  const start = vietnamCalendarStart(value);
  return new Date(start.getTime() - days * 24 * 60 * 60 * 1000);
}
