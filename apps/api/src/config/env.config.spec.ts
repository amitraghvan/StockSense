import { validateEnv } from './env.config';

describe('Environment Validation Foundation', () => {
  const validConfig = {
    NODE_ENV: 'development',
    APP_NAME: 'stocksense-api',
    APP_VERSION: '0.1.0',
    PORT: '4000',
    HOST: '0.0.0.0',
    API_PREFIX: 'api/v1',
    DATABASE_URL: 'postgresql://stocksense:secret@localhost:5432/stocksense_dev',
    REDIS_URL: 'redis://localhost:6379',
    CORS_ORIGIN: 'http://localhost:3000',
    LOG_LEVEL: 'info',
  };

  it('should successfully validate and parse valid environment configuration', () => {
    const parsed = validateEnv(validConfig);
    expect(parsed.PORT).toBe(4000);
    expect(parsed.NODE_ENV).toBe('development');
    expect(parsed.APP_NAME).toBe('stocksense-api');
    expect(parsed.DATABASE_URL).toBe(validConfig.DATABASE_URL);
  });

  it('should fail fast when required DATABASE_URL is missing or invalid', () => {
    const invalidConfig = { ...validConfig, DATABASE_URL: 'invalid-url' };
    expect(() => validateEnv(invalidConfig)).toThrow('Invalid environment configuration');
  });

  it('should fail fast when required REDIS_URL is missing', () => {
    const { REDIS_URL: _, ...withoutRedis } = validConfig;
    expect(() => validateEnv(withoutRedis)).toThrow('Invalid environment configuration');
  });

  it('should fail fast when PORT is not a valid number', () => {
    const invalidPortConfig = { ...validConfig, PORT: 'not-a-number' };
    expect(() => validateEnv(invalidPortConfig)).toThrow('Invalid environment configuration');
  });
});
