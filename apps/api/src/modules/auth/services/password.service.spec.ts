import { PasswordService } from './password.service';

describe('PasswordService (Phase 02 Security)', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  describe('Argon2id Hashing & Verification', () => {
    it('should generate an Argon2id hash containing the argon2id identifier', async () => {
      const password = 'TestSecurePassword123!';
      const hash = await service.hash(password);

      expect(hash).toBeDefined();
      expect(hash.startsWith('$argon2id$')).toBe(true);
    });

    it('should successfully verify a correct password against its Argon2id hash', async () => {
      const password = 'CorrectPassword456$';
      const hash = await service.hash(password);

      const isValid = await service.verify(hash, password);
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect password', async () => {
      const password = 'OriginalPassword789#';
      const hash = await service.hash(password);

      const isValid = await service.verify(hash, 'WrongPassword789#');
      expect(isValid).toBe(false);
    });

    it('should return false gracefully on corrupted hash', async () => {
      const isValid = await service.verify('invalid-corrupted-hash', 'AnyPassword123!');
      expect(isValid).toBe(false);
    });
  });

  describe('Password Policy Complexity Enforcement', () => {
    it('should accept a compliant password', () => {
      const result = service.validatePolicy('SecurePass123!');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = service.validatePolicy('Short1!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 8 characters');
    });

    it('should reject passwords missing uppercase letters', () => {
      const result = service.validatePolicy('lowercase123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('uppercase');
    });

    it('should reject passwords missing lowercase letters', () => {
      const result = service.validatePolicy('UPPERCASE123!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('lowercase');
    });

    it('should reject passwords missing digits', () => {
      const result = service.validatePolicy('NoDigitsHere!');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('number');
    });

    it('should reject passwords missing special characters', () => {
      const result = service.validatePolicy('NoSpecialChar123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('special character');
    });
  });
});
