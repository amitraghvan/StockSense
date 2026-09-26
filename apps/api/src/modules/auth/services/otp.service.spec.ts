import { OtpService } from './otp.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { BadRequestException } from '@nestjs/common';

describe('OtpService (Phase 02 Security)', () => {
  let service: OtpService;
  let mockPrisma: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      passwordResetOtp: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    mockRedis = {
      getClient: jest.fn().mockReturnValue({
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null),
      }),
    };

    service = new OtpService(
      mockPrisma as unknown as PrismaService,
      mockRedis as unknown as RedisService,
    );
  });

  describe('OTP Generation & Cooldown', () => {
    it('should generate a 6-digit numeric OTP and store its SHA-256 hash', async () => {
      mockPrisma.passwordResetOtp.findFirst.mockResolvedValue(null);
      mockPrisma.passwordResetOtp.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetOtp.create.mockResolvedValue({ id: 'otp-1' });

      const result = await service.generateOtp('user-123');

      expect(result.code).toMatch(/^\d{6}$/);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(result.cooldownUntil.getTime()).toBeGreaterThan(Date.now());

      expect(mockPrisma.passwordResetOtp.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            otpHash: service.hashOtp(result.code),
            attempts: 0,
          }),
        }),
      );
    });

    it('should throw BadRequestException if requested before cooldown expires', async () => {
      const activeCooldownDate = new Date(Date.now() + 45 * 1000); // 45 seconds in future
      mockPrisma.passwordResetOtp.findFirst.mockResolvedValue({
        id: 'otp-recent',
        resendCooldownUntil: activeCooldownDate,
      });

      await expect(service.generateOtp('user-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('OTP Verification & Attempt Limits', () => {
    it('should verify matching OTP successfully', async () => {
      const testCode = '654321';
      const hash = service.hashOtp(testCode);

      mockPrisma.passwordResetOtp.findFirst.mockResolvedValue({
        id: 'otp-record-1',
        userId: 'user-123',
        otpHash: hash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 500000),
        usedAt: null,
      });

      const verification = await service.verifyOtp('user-123', testCode);
      expect(verification.valid).toBe(true);
      expect(verification.userId).toBe('user-123');
    });

    it('should increment attempt count and reject incorrect OTP', async () => {
      const realCode = '123456';
      const realHash = service.hashOtp(realCode);

      mockPrisma.passwordResetOtp.findFirst.mockResolvedValue({
        id: 'otp-record-2',
        userId: 'user-123',
        otpHash: realHash,
        attempts: 1,
        expiresAt: new Date(Date.now() + 500000),
        usedAt: null,
      });

      mockPrisma.passwordResetOtp.update.mockResolvedValue({
        id: 'otp-record-2',
        attempts: 2,
      });

      const verification = await service.verifyOtp('user-123', '999999');
      expect(verification.valid).toBe(false);
      expect(verification.message).toContain('3 attempts remaining');
      expect(mockPrisma.passwordResetOtp.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { attempts: { increment: 1 } },
        }),
      );
    });

    it('should invalidate code if maximum attempts (5) are reached', async () => {
      mockPrisma.passwordResetOtp.findFirst.mockResolvedValue({
        id: 'otp-record-3',
        userId: 'user-123',
        otpHash: 'anyhash',
        attempts: 5,
        expiresAt: new Date(Date.now() + 500000),
        usedAt: null,
      });

      mockPrisma.passwordResetOtp.update.mockResolvedValue({ id: 'otp-record-3' });

      const verification = await service.verifyOtp('user-123', '000000');
      expect(verification.valid).toBe(false);
      expect(verification.message).toContain('Too many incorrect attempts');
    });

    it('should reject expired OTP', async () => {
      mockPrisma.passwordResetOtp.findFirst.mockResolvedValue({
        id: 'otp-record-4',
        userId: 'user-123',
        otpHash: 'anyhash',
        attempts: 0,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        usedAt: null,
      });

      const verification = await service.verifyOtp('user-123', '123456');
      expect(verification.valid).toBe(false);
      expect(verification.message).toContain('expired');
    });
  });

  describe('OTP Single-Use Consumption', () => {
    it('should mark OTP as used upon consumption', async () => {
      const code = '789123';
      const hash = service.hashOtp(code);

      mockPrisma.passwordResetOtp.findFirst.mockResolvedValue({
        id: 'otp-record-5',
        userId: 'user-123',
        otpHash: hash,
        attempts: 0,
        expiresAt: new Date(Date.now() + 500000),
        usedAt: null,
      });
      mockPrisma.passwordResetOtp.update.mockResolvedValue({ id: 'otp-record-5' });

      const consumed = await service.consumeOtp('user-123', code);
      expect(consumed).toBe(true);
      expect(mockPrisma.passwordResetOtp.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'otp-record-5' },
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
