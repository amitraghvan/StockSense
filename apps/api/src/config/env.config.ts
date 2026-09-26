import { ApiEnv, ApiEnvSchema } from '@stocksense/validation';

export function validateEnv(config: Record<string, unknown>): ApiEnv {
  const result = ApiEnvSchema.safeParse(config);

  if (!result.success) {
    const formattedErrors = result.error.format();
    console.error('====================================================');
    console.error('FATAL: ENVIRONMENT CONFIGURATION VALIDATION FAILED:');
    console.error(JSON.stringify(formattedErrors, null, 2));
    console.error('====================================================');
    throw new Error('Invalid environment configuration. Application shutting down.');
  }

  return result.data;
}
