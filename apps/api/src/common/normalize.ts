export function normalizeUsername(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

export function normalizeEmail(value: string): string {
  return value.trim().toLocaleLowerCase('en-US');
}

export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('0')) return `+84${digits.slice(1)}`;
  return digits.startsWith('+') ? digits : `+${digits}`;
}
