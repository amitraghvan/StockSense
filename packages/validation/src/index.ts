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
