import { deviceLabel, normalizeIp } from './activity.service';

describe('activity helpers', () => {
  it('normalizes IPv4-mapped client IP addresses', () => {
    expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('derives a safe, friendly device label from a user agent', () => {
    expect(deviceLabel('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36')).toBe('Chrome · Windows · Desktop');
  });

  it('does not preserve technical user agent detail in the public device label', () => {
    expect(deviceLabel()).toBe('Thiết bị không xác định');
  });
});
