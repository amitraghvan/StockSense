import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PasswordSchema } from '@stocksense/validation';

@Injectable()
export class PasswordService {
  /**
   * Hashes a plaintext password using Argon2id with memory-hard parameters.
   */
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  /**
   * Verifies a candidate password against an Argon2id hash in constant time.
   */
  async verify(hash: string, candidate: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, candidate);
    } catch {
      return false;
    }
  }

  /**
   * Validates whether a password satisfies the security complexity policy:
   * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
   */
  validatePolicy(password: string): { valid: boolean; error?: string } {
    const result = PasswordSchema.safeParse(password);
    if (!result.success) {
      return {
        valid: false,
        error: result.error.errors[0]?.message ?? 'Password does not meet complexity requirements',
      };
    }
    return { valid: true };
  }
}
