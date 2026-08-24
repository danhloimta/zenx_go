import { serializeBigInts } from './serialization';

describe('serializeBigInts', () => {
  it('serializes bigint and Date values without leaking implementation objects', () => {
    const createdAt = new Date('2026-08-24T00:00:00.000Z');
    expect(serializeBigInts({ balance: 12500n, createdAt })).toEqual({ balance: '12500', createdAt: createdAt.toISOString() });
  });

  it('walks nested arrays and objects', () => {
    expect(serializeBigInts({ rows: [{ amount: 10n }, { amount: 20n }] })).toEqual({ rows: [{ amount: '10' }, { amount: '20' }] });
  });
});
