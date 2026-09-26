import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditEventParams {
  userId?: string | null;
  tenantId?: string | null;
  event: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an identity, authorization, or tenant lifecycle audit event.
   * Ensures sensitive secrets (passwords, OTPs, tokens) are never recorded.
   */
  async logEvent(params: AuditEventParams): Promise<void> {
    try {
      const sanitizedMetadata = this.sanitizeMetadata(params.metadata);

      await this.prisma.identityAuditLog.create({
        data: {
          userId: params.userId ?? null,
          tenantId: params.tenantId ?? null,
          event: params.event,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ? params.userAgent.substring(0, 500) : null,
          metadata: sanitizedMetadata as Prisma.InputJsonValue,
        },
      });

      this.logger.debug(
        `Audit: [${params.event}] user=${params.userId ?? 'anonymous'} tenant=${params.tenantId ?? 'none'}`,
      );
    } catch (error) {
      // Audit failure must never crash the primary business operation, but should be logged.
      this.logger.error(
        `Failed to record audit event "${params.event}": ${(error as Error).message}`,
      );
    }
  }

  /**
   * Defensive sanitizer: strips any potential secret keys.
   */
  private sanitizeMetadata(
    metadata?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!metadata) return null;

    const sensitiveKeys = [
      'password',
      'passwordhash',
      'token',
      'refreshtoken',
      'accesstoken',
      'otp',
      'otphash',
      'secret',
      'authorization',
      'cookie',
    ];

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
