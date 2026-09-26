import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../../config/config.module';
import { RedisModule } from '../../infrastructure/redis/redis.module';
import { AuditModule } from '../audit/audit.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { OtpService } from './services/otp.service';
import { EmailService, ConsoleEmailProvider } from './services/email.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [ConfigModule, JwtModule.register({}), RedisModule, AuditModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    OtpService,
    EmailService,
    ConsoleEmailProvider,
    JwtAuthGuard,
    TenantGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    OtpService,
    EmailService,
    JwtAuthGuard,
    TenantGuard,
    PermissionsGuard,
  ],
})
export class AuthModule {}
