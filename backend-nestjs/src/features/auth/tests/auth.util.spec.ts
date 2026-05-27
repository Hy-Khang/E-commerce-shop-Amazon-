import { hashToken } from '../utils/auth.util';

describe('hashToken', () => {
  it('should return a SHA-256 hex string', () => {
    const result = hashToken('test-token');

    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce deterministic output for the same input', () => {
    const hash1 = hashToken('same-token');
    const hash2 = hashToken('same-token');

    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashToken('token-a');
    const hash2 = hashToken('token-b');

    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty string input', () => {
    const result = hashToken('');

    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });
});
