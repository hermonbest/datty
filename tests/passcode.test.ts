import { hashPasscode, generateSalt, validatePasscodeFormat } from '../src/services/passcodeUtils';

describe('Passcode security and hashing functions', () => {
  it('hashes identical PINs with identical salts consistently', () => {
    const pin = '1234';
    const salt = 'randomSalt_123';
    const hash1 = hashPasscode(pin, salt);
    const hash2 = hashPasscode(pin, salt);

    expect(hash1).toBeDefined();
    expect(hash1).toBe(hash2);
    expect(typeof hash1).toBe('string');
  });

  it('produces different hashes for different PINs with same salt', () => {
    const salt = 'common_salt';
    const hash1 = hashPasscode('1234', salt);
    const hash2 = hashPasscode('5678', salt);

    expect(hash1).not.toBe(hash2);
  });

  it('produces different hashes for identical PINs with different salts', () => {
    const pin = '9876';
    const saltA = 'salt_alpha';
    const saltB = 'salt_beta';

    const hashA = hashPasscode(pin, saltA);
    const hashB = hashPasscode(pin, saltB);

    expect(hashA).not.toBe(hashB);
  });

  it('correctly handles various 4-digit numeric combinations', () => {
    const salt = 'test_salt_key';
    const h0000 = hashPasscode('0000', salt);
    const h9999 = hashPasscode('9999', salt);
    const h0420 = hashPasscode('0420', salt);

    expect(h0000).not.toBe(h9999);
    expect(h0000).not.toBe(h0420);
    expect(h0000.length).toBeGreaterThan(0);
  });

  it('generates distinct non-empty random salts', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    expect(salt1).toBeDefined();
    expect(salt2).toBeDefined();
    expect(salt1).not.toBe(salt2);
    expect(salt1.length).toBeGreaterThan(6);
  });

  it('validates 4-digit passcode format', () => {
    expect(validatePasscodeFormat('1234')).toBe(true);
    expect(validatePasscodeFormat('0000')).toBe(true);
    expect(validatePasscodeFormat('9876')).toBe(true);

    expect(validatePasscodeFormat('123')).toBe(false);
    expect(validatePasscodeFormat('12345')).toBe(false);
    expect(validatePasscodeFormat('abcd')).toBe(false);
    expect(validatePasscodeFormat('')).toBe(false);
  });
});
