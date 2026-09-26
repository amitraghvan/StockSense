import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EnvService } from '../../../config/env.service';
import { JwtAccessPayload, JwtRefreshPayload } from '@stocksense/types';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly accessExpiration: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiration: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly envService: EnvService,
  ) {
    this.accessSecret = this.envService.get('JWT_ACCESS_SECRET');
    this.accessExpiration = this.envService.get('JWT_ACCESS_EXPIRATION');
    this.refreshSecret = this.envService.get('JWT_REFRESH_SECRET');
    this.refreshExpiration = this.envService.get('JWT_REFRESH_EXPIRATION');
  }

  /**
   * Generates a signed short-lived JWT access token containing identity, active tenant, and permissions.
   */
  async generateAccessToken(payload: JwtAccessPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiration as any,
    });
  }

  /**
   * Generates a signed long-lived refresh token.
   */
  async generateRefreshToken(payload: JwtRefreshPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiration as any,
    });
  }

  /**
   * Verifies and decodes an access token.
   */
  async verifyAccessToken(token: string): Promise<JwtAccessPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.accessSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }

  /**
   * Verifies and decodes a refresh token.
   */
  async verifyRefreshToken(token: string): Promise<JwtRefreshPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtRefreshPayload>(token, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired session refresh token');
    }
  }

  /**
   * Generates a SHA-256 hash of a refresh token to store in the database/Redis,
   * ensuring refresh tokens cannot be stolen via raw database dumps.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
