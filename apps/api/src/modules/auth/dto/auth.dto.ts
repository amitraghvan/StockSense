import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Alex Mercer', description: 'Full legal or display name' })
  name!: string;

  @ApiProperty({ example: 'alex@example.com', description: 'Unique user email address' })
  email!: string;

  @ApiProperty({
    example: 'P@ssw0rd123!',
    description:
      'Password satisfying minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol',
  })
  password!: string;

  @ApiPropertyOptional({
    example: 'Apex Logistics Inc.',
    description: 'Initial workspace or organization name',
  })
  tenantName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'alex@example.com', description: 'Registered account email' })
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd123!', description: 'Account password' })
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid refresh token string' })
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'alex@example.com', description: 'Account email to receive OTP' })
  email!: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'alex@example.com', description: 'Account email' })
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit one-time verification code' })
  otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'alex@example.com', description: 'Account email' })
  email!: string;

  @ApiProperty({ example: '123456', description: '6-digit one-time verification code' })
  otp!: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    description: 'New password satisfying complexity requirements',
  })
  newPassword!: string;
}

export class SwitchTenantDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Target workspace UUID',
  })
  tenantId!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Alex Mercer', description: 'Updated display name' })
  name!: string;
}
