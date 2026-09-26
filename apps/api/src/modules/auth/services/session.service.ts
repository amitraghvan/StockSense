import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { TokenService } from './token.service';

export interface CreateSessionParams {
  userId: string;
  tenantId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface ActiveSessionContext {
  id: string;
  userId: string;
  tenantId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly refreshTtlDays = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Creates a new session record in PostgreSQL and registers it in Redis.
   * Returns session record and signed refresh token.
   */
  async createSession(params: CreateSessionParams): Promise<{
    sessionId: string;
    refreshToken: string;
  }> {
    const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);
    const initialPlaceholderHash = this.tokenService.hashToken(
      `initial-${Date.now()}-${Math.random()}`,
    );

    // Create session in DB first to acquire UUID
    const session = await this.prisma.session.create({
      data: {
        userId: params.userId,
        tenantId: params.tenantId ?? null,
        userAgent: params.userAgent ? params.userAgent.substring(0, 500) : null,
        ipAddress: params.ipAddress ?? null,
        tokenHash: initialPlaceholderHash,
        expiresAt,
      },
    });

    // Generate refresh token referencing sessionId
    const refreshToken = await this.tokenService.generateRefreshToken({
      sub: params.userId,
      sessionId: session.id,
    });

    const tokenHash = this.tokenService.hashToken(refreshToken);

    // Update with real token hash
    await this.prisma.session.update({
      where: { id: session.id },
      data: { tokenHash },
    });

    // Cache in Redis for sub-millisecond session validation
    const redisClient = this.redisService.getClient();
    if (redisClient) {
      const redisKey = `session:${session.id}`;
      const ttlSeconds = this.refreshTtlDays * 24 * 60 * 60;

      await redisClient.set(
        redisKey,
        JSON.stringify({
          userId: params.userId,
          tenantId: params.tenantId ?? null,
          tokenHash,
          expiresAt: expiresAt.toISOString(),
        }),
        'EX',
        ttlSeconds,
      );
    }

    return {
      sessionId: session.id,
      refreshToken,
    };
  }

  /**
   * Validates that a session exists, is not expired, is not revoked, and matches the token hash.
   */
  async validateSession(sessionId: string, refreshToken?: string): Promise<ActiveSessionContext> {
    const redisClient = this.redisService.getClient();
    const redisKey = `session:${sessionId}`;
    const cached = redisClient ? await redisClient.get(redisKey) : null;

    let session: ActiveSessionContext | null = null;
    let storedHash = '';

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        session = {
          id: sessionId,
          userId: parsed.userId,
          tenantId: parsed.tenantId,
          expiresAt: new Date(parsed.expiresAt),
          revokedAt: null,
        };
        storedHash = parsed.tokenHash;
      } catch {
        // Fall back to database lookup
      }
    }

    if (!session) {
      const dbSession = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!dbSession) {
        throw new UnauthorizedException('Session not found or expired');
      }

      session = {
        id: dbSession.id,
        userId: dbSession.userId,
        tenantId: dbSession.tenantId,
        expiresAt: dbSession.expiresAt,
        revokedAt: dbSession.revokedAt,
      };
      storedHash = dbSession.tokenHash;
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Session has expired');
    }

    if (refreshToken) {
      const candidateHash = this.tokenService.hashToken(refreshToken);
      if (candidateHash !== storedHash) {
        // Security alarm: Refresh token reused or mismatched! Invalidate immediately.
        await this.revokeSession(sessionId);
        throw new UnauthorizedException(
          'Security alert: Token reuse detected. Session terminated.',
        );
      }
    }

    return session;
  }

  /**
   * Rotates a refresh token for an existing session (Token Rotation).
   */
  async rotateRefreshToken(sessionId: string, userId: string): Promise<string> {
    const newRefreshToken = await this.tokenService.generateRefreshToken({
      sub: userId,
      sessionId,
    });
    const newTokenHash = this.tokenService.hashToken(newRefreshToken);

    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        tokenHash: newTokenHash,
        updatedAt: new Date(),
      },
    });

    const redisClient = this.redisService.getClient();
    if (redisClient) {
      const redisKey = `session:${sessionId}`;
      const remainingSeconds = Math.max(
        60,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
      );

      await redisClient.set(
        redisKey,
        JSON.stringify({
          userId,
          tenantId: session.tenantId,
          tokenHash: newTokenHash,
          expiresAt: session.expiresAt.toISOString(),
        }),
        'EX',
        remainingSeconds,
      );
    }

    return newRefreshToken;
  }

  /**
   * Updates the active tenant on a session (when switching workspace).
   */
  async updateSessionTenant(sessionId: string, tenantId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { tenantId },
    });

    const redisClient = this.redisService.getClient();
    if (redisClient) {
      const redisKey = `session:${sessionId}`;
      const cached = await redisClient.get(redisKey);

      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.tenantId = tenantId;
        const ttl = await redisClient.ttl(redisKey);
        if (ttl > 0) {
          await redisClient.set(redisKey, JSON.stringify(parsed), 'EX', ttl);
        }
      }
    }
  }

  /**
   * Revokes a single session (Logout).
   */
  async revokeSession(sessionId: string): Promise<void> {
    try {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Ignore if already deleted/revoked
    }

    const redisClient = this.redisService.getClient();
    if (redisClient) {
      await redisClient.del(`session:${sessionId}`);
    }
  }

  /**
   * Revokes all active sessions for a user (called after password reset).
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });

    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const redisClient = this.redisService.getClient();
    if (redisClient) {
      for (const s of sessions) {
        await redisClient.del(`session:${s.id}`);
      }
    }

    this.logger.log(`Revoked all (${sessions.length}) active sessions for user ${userId}.`);
  }
}
