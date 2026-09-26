import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import * as crypto from 'crypto';

export interface GeneratedOtpResult {
  code: string; // Plaintext OTP returned ONLY to the caller to dispatch via EmailService, NEVER logged or stored
  expiresAt: Date;
  cooldownUntil: Date;
}

export interface VerifyOtpResult {
  valid: boolean;
  message?: string;
  userId?: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  // Default configuration fallback
  private readonly ttlSeconds = 600; // 10 minutes
  private readonly cooldownSeconds = 60; // 1 minute
  private readonly maxAttempts = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Hashes the plaintext OTP using SHA-256 to ensure no plaintext exists in database.
   */
  hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }

  /**
   * Generates a cryptographically random 6-digit numeric OTP for a user.
   * Enforces resend cooldown and invalidates any previous active OTPs.
   */
  async generateOtp(userId: string): Promise<GeneratedOtpResult> {
    const now = new Date();

    // 1. Check for active cooldown on existing OTP for this user
    const latestOtp = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (latestOtp && latestOtp.resendCooldownUntil > now) {
      const waitSeconds = Math.ceil(
        (latestOtp.resendCooldownUntil.getTime() - now.getTime()) / 1000,
      );
      throw new BadRequestException(
        `Please wait ${waitSeconds} seconds before requesting a new verification code.`,
      );
    }

    // 2. Invalidate any existing unconsumed OTPs for this user
    await this.prisma.passwordResetOtp.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: now, // mark as invalidated/consumed
      },
    });

    // 3. Generate cryptographically random 6-digit number [100000 - 999999]
    const numericOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(numericOtp);

    const expiresAt = new Date(now.getTime() + this.ttlSeconds * 1000);
    const cooldownUntil = new Date(now.getTime() + this.cooldownSeconds * 1000);

    // 4. Save hashed record to database
    await this.prisma.passwordResetOtp.create({
      data: {
        userId,
        otpHash,
        attempts: 0,
        expiresAt,
        resendCooldownUntil: cooldownUntil,
      },
    });

    // 5. Store rate-limit counter in Redis if available
    const redisClient = this.redisService.getClient();
    if (redisClient) {
      await redisClient.set(`otp:ratelimit:${userId}`, '0', 'EX', this.ttlSeconds);
    }

    this.logger.log(
      `Generated password reset OTP for user ${userId}. Expiration: ${expiresAt.toISOString()}`,
    );

    return {
      code: numericOtp,
      expiresAt,
      cooldownUntil,
    };
  }

  /**
   * Verifies an OTP provided by a user against stored hash, verifying expiration,
   * attempt thresholds, and single-use status.
   */
  async verifyOtp(userId: string, candidateOtp: string): Promise<VerifyOtpResult> {
    const now = new Date();

    const record = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return {
        valid: false,
        message: 'No active verification code found. Please request a new code.',
      };
    }

    // Check expiration
    if (record.expiresAt < now) {
      return {
        valid: false,
        message: 'Verification code has expired. Please request a new code.',
      };
    }

    // Check maximum attempts
    if (record.attempts >= this.maxAttempts) {
      // Invalidate on brute-force threshold
      await this.prisma.passwordResetOtp.update({
        where: { id: record.id },
        data: { usedAt: now },
      });
      return {
        valid: false,
        message: 'Too many incorrect attempts. This code has been invalidated for security.',
      };
    }

    // Hash candidate and compare
    const candidateHash = this.hashOtp(candidateOtp);
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(candidateHash, 'hex'),
      Buffer.from(record.otpHash, 'hex'),
    );

    if (!isMatch) {
      // Increment attempt counter
      const updatedRecord = await this.prisma.passwordResetOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts = this.maxAttempts - updatedRecord.attempts;
      return {
        valid: false,
        message:
          remainingAttempts > 0
            ? `Invalid code. ${remainingAttempts} attempts remaining.`
            : 'Too many incorrect attempts. This code has been invalidated for security.',
      };
    }

    return {
      valid: true,
      userId,
    };
  }

  /**
   * Consumes the OTP, ensuring single-use.
   */
  async consumeOtp(userId: string, candidateOtp: string): Promise<boolean> {
    const verification = await this.verifyOtp(userId, candidateOtp);
    if (!verification.valid) {
      return false;
    }

    const candidateHash = this.hashOtp(candidateOtp);
    const record = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        otpHash: candidateHash,
        usedAt: null,
      },
    });

    if (record) {
      await this.prisma.passwordResetOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
      return true;
    }

    return false;
  }
}
