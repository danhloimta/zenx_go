import { ConfigService } from '@nestjs/config';
import { SensitiveProfileCrypto, normalizeSecurityAnswer } from './sensitive-profile.service';

const encryptionKey = Buffer.alloc(32, 7).toString('base64');

describe('SensitiveProfileCrypto', () => {
  it('encrypts and decrypts identity data while keeping lookup hash stable', () => {
    const crypto = new SensitiveProfileCrypto(
      new ConfigService({ sensitiveProfileEncryptionKey: encryptionKey }),
    );
    const identity = {
      citizenId: '079123456789',
      issuedAt: '2024-05-20',
      issuedPlace: 'Cục Cảnh sát quản lý hành chính',
    };

    const first = crypto.encrypt(identity);
    const second = crypto.encrypt(identity);

    expect(first.ciphertext).not.toBe(second.ciphertext);
    expect(first.iv).not.toBe(second.iv);
    expect(first.lookupHash).toBe(second.lookupHash);
    expect(first.last4).toBe('6789');
    expect(crypto.decrypt(first)).toEqual(identity);
  });

  it('rejects tampered ciphertext or authentication metadata', () => {
    const crypto = new SensitiveProfileCrypto(
      new ConfigService({ sensitiveProfileEncryptionKey: encryptionKey }),
    );
    const encrypted = crypto.encrypt({
      citizenId: '079123456789',
      issuedAt: '2024-05-20',
      issuedPlace: 'Hà Nội',
    });

    expect(() =>
      crypto.decrypt({ ...encrypted, ciphertext: `${encrypted.ciphertext.slice(0, -2)}xx` }),
    ).toThrow();
    expect(() =>
      crypto.decrypt({ ...encrypted, authTag: Buffer.alloc(16).toString('base64') }),
    ).toThrow();
  });
});

describe('normalizeSecurityAnswer', () => {
  it('normalizes Unicode form, case, and whitespace without removing accents', () => {
    expect(normalizeSecurityAnswer('  Trường   Tiểu Học  Ánh   Dương ')).toBe(
      'trường tiểu học ánh dương',
    );
  });
});
