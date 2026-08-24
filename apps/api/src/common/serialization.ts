import { DECIMAL_FIELDS } from './constants';

export function serializeBigInts<T>(value: T): T {
  if (typeof value === 'bigint') return value.toString() as T;
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) return value.map(serializeBigInts) as T;
  if (!value || typeof value !== 'object') return value;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    output[key] = typeof item === 'bigint' || DECIMAL_FIELDS.includes(key as never)
      ? item?.toString()
      : serializeBigInts(item);
  }
  return output as T;
}
