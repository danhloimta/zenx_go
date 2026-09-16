export function auditRangeEnd(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  return new Date(value);
}
