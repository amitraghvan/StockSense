import { Controller, Post, Get, Body, Req, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthService } from './services/auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  VerifyOtpSchema,
  ResetPasswordSchema,
  SwitchTenantSchema,
} from '@stocksense/validation';
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  VerifyOtpDto,
  ResetPasswordDto,
  SwitchTenantDto,
} from './dto/auth.dto';
import { JwtAccessPayload } from '@stocksense/types';

@ApiTags('Authentication & Identity')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user identity and default workspace' })
  @ApiResponse({ status: 201, description: 'User successfully registered and session established' })
  @ApiResponse({ status: 409, description: 'Email address already registered' })
  @UsePipes(new ZodValidationPipe(SignupSchema))
  async signup(@Body() dto: SignupDto, @Req() req: FastifyRequest) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.signup(dto, ip, userAgent);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user credentials and establish session' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate current authenticated session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  async logout(@CurrentUser() user: JwtAccessPayload, @Req() req: FastifyRequest) {
    const sessionId = (req as any).sessionId || user?.sessionId;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    if (sessionId) {
      await this.authService.logout(sessionId, user?.sub, ip, userAgent);
    }
    return { message: 'Successfully logged out.' };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiResponse({ status: 200, description: 'Tokens successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: FastifyRequest) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.refresh(dto.refreshToken, ip, userAgent);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP verification code for password reset' })
  @ApiResponse({ status: 200, description: 'Verification code dispatched if account exists' })
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: FastifyRequest) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.forgotPassword(dto, ip, userAgent);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify candidate OTP before allowing password change' })
  @ApiResponse({ status: 200, description: 'Verification check completed' })
  @UsePipes(new ZodValidationPipe(VerifyOtpSchema))
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset account password with valid OTP' })
  @ApiResponse({ status: 200, description: 'Password reset and all sessions terminated' })
  @ApiResponse({ status: 400, description: 'Invalid OTP or password complexity failed' })
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: FastifyRequest) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.resetPassword(dto, ip, userAgent);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile, active tenant, and memberships' })
  @ApiResponse({ status: 200, description: 'User profile and tenant context' })
  async getMe(@CurrentUser() user: JwtAccessPayload, @Req() req: FastifyRequest) {
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    const currentTenantId = headerTenantId || user.tenantId;
    return this.authService.getMe(user.sub, currentTenantId);
  }

  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch active workspace/tenant context' })
  @ApiResponse({ status: 200, description: 'Switched workspace context with new access token' })
  @ApiResponse({ status: 403, description: 'User is not a member of target workspace' })
  @UsePipes(new ZodValidationPipe(SwitchTenantSchema))
  async switchTenant(
    @CurrentUser() user: JwtAccessPayload,
    @Body() dto: SwitchTenantDto,
    @Req() req: FastifyRequest,
  ) {
    const sessionId = (req as any).sessionId || user.sessionId;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.authService.switchTenant(user.sub, dto.tenantId, sessionId, ip, userAgent);
  }
}
