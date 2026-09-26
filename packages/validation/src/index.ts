import { z } from 'zod';

export const NodeEnvSchema = z.enum(['development', 'test', 'production']);
export type NodeEnv = z.infer<typeof NodeEnvSchema>;

export const ApiEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema.default('development'),
  APP_NAME: z.string().min(1).default('stocksense-api'),
  APP_VERSION: z.string().min(1).default('0.1.0'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('api/v1'),
  DATABASE_URL: z.string().url().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().url().min(1, 'REDIS_URL is required'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  RATE_LIMIT_TTL: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // Phase 02: Auth, Session, and OTP Security Settings
  JWT_ACCESS_SECRET: z
    .string()
    .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
    .default('stocksense_jwt_access_super_secret_for_development_minimum_32_characters_long_12345'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters')
    .default(
      'stocksense_jwt_refresh_super_secret_for_development_minimum_32_characters_long_67890',
    ),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  COOKIE_SECRET: z
    .string()
    .min(32, 'COOKIE_SECRET must be at least 32 characters')
    .default('stocksense_cookie_super_secret_for_development_minimum_32_characters_long_54321'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(600), // 10 minutes
  OTP_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60), // 60 seconds
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;

export const WebEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema.default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().default('StockSense'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000/api/v1'),
});

export type WebEnv = z.infer<typeof WebEnvSchema>;

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

// ==============================================================================
// Phase 02: Granular System Permissions
// ==============================================================================

export const SystemPermissions = {
  // Products Catalog (Phase 02 authorization foundation only)
  PRODUCT_VIEW: 'product:view',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',

  // Operations & Transfers
  RECEIPT_VIEW: 'receipt:view',
  RECEIPT_CREATE: 'receipt:create',
  RECEIPT_VALIDATE: 'receipt:validate',

  DELIVERY_VIEW: 'delivery:view',
  DELIVERY_CREATE: 'delivery:create',
  DELIVERY_VALIDATE: 'delivery:validate',

  TRANSFER_VIEW: 'transfer:view',
  TRANSFER_CREATE: 'transfer:create',
  TRANSFER_VALIDATE: 'transfer:validate',

  ADJUSTMENT_VIEW: 'adjustment:view',
  ADJUSTMENT_CREATE: 'adjustment:create',
  ADJUSTMENT_VALIDATE: 'adjustment:validate',

  // Warehouses & Stock
  WAREHOUSE_VIEW: 'warehouse:view',
  WAREHOUSE_MANAGE: 'warehouse:manage',
  STOCK_VIEW: 'stock:view',

  // Reports
  REPORTS_VIEW: 'reports:view',

  // Tenant & Organization Administration
  TENANT_MANAGE: 'tenant:manage',
  USER_MANAGE: 'user:manage',
  ROLE_MANAGE: 'role:manage',
  AUDIT_VIEW: 'audit:view',
} as const;

export type SystemPermission = (typeof SystemPermissions)[keyof typeof SystemPermissions];

// ==============================================================================
// Phase 02: Authentication & Identity Validation Schemas
// ==============================================================================

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const EmailSchema = z
  .string()
  .email('Please provide a valid email address')
  .max(255, 'Email must not exceed 255 characters')
  .transform((val) => val.toLowerCase().trim());

export const SignupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: EmailSchema,
  password: PasswordSchema,
  tenantName: z
    .string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(100)
    .optional(),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const VerifyOtpSchema = z.object({
  email: EmailSchema,
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

export const ResetPasswordSchema = z.object({
  email: EmailSchema,
  otp: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only numbers'),
  newPassword: PasswordSchema,
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const SwitchTenantSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant identifier format'),
});

export type SwitchTenantInput = z.infer<typeof SwitchTenantSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
