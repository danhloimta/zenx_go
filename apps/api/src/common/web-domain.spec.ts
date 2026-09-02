import { classifyWebHost, isAllowedReturnTo, isAllowedWebOrigin, normalizeHostname } from './web-domain';

describe('web domain policy', () => {
  it('normalizes hostnames without trusting ports or casing', () => {
    expect(normalizeHostname('LUC-DIA.ZENXGO.IO.VN:443')).toBe('luc-dia.zenxgo.io.vn');
    expect(normalizeHostname('https://Example.com:3000/path')).toBe('example.com');
  });

  it('recognizes only direct game subdomains and reserved names', () => {
    expect(classifyWebHost('zenxgo.io.vn', 'zenxgo.io.vn')).toEqual({ kind: 'ROOT' });
    expect(classifyWebHost('lucdia.zenxgo.io.vn', 'zenxgo.io.vn')).toEqual({ kind: 'GAME', subdomain: 'lucdia' });
    expect(classifyWebHost('api.zenxgo.io.vn', 'zenxgo.io.vn')).toEqual({ kind: 'RESERVED', subdomain: 'api' });
    expect(classifyWebHost('evilzenxgo.io.vn', 'zenxgo.io.vn')).toEqual({ kind: 'UNKNOWN' });
    expect(classifyWebHost('a.lucdia.zenxgo.io.vn', 'zenxgo.io.vn')).toEqual({ kind: 'UNKNOWN' });
  });

  it('allows explicit origins and game subdomains but rejects foreign origins', () => {
    expect(isAllowedWebOrigin('https://zenxgo.io.vn', 'zenxgo.io.vn')).toBe(true);
    expect(isAllowedWebOrigin('https://lucdia.zenxgo.io.vn', 'zenxgo.io.vn')).toBe(true);
    expect(isAllowedWebOrigin('https://lucdia.zenxgo.io.vn', 'zenxgo.io.vn', ['https://lucdia.zenxgo.io.vn'], false)).toBe(false);
    expect(isAllowedWebOrigin('https://evilzenxgo.io.vn', 'zenxgo.io.vn')).toBe(false);
    expect(isAllowedWebOrigin('http://localhost:3000', 'localhost', ['http://localhost:3000'])).toBe(true);
  });

  it('accepts only absolute return URLs within the ecosystem', () => {
    expect(isAllowedReturnTo('https://lucdia.zenxgo.io.vn/tin-tuc?x=1', 'zenxgo.io.vn')).toBe(true);
    expect(isAllowedReturnTo('https://evilzenxgo.io.vn/account', 'zenxgo.io.vn')).toBe(false);
    expect(isAllowedReturnTo('//evil.example/account', 'zenxgo.io.vn')).toBe(false);
    expect(isAllowedReturnTo('javascript:alert(1)', 'zenxgo.io.vn')).toBe(false);
  });
});
