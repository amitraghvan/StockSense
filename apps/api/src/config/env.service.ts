import { Injectable } from '@nestjs/common';
import { ApiEnv } from '@stocksense/validation';
import { validateEnv } from './env.config';

@Injectable()
export class EnvService {
  private readonly env: ApiEnv;

  constructor() {
    this.env = validateEnv(process.env);
  }

  get<K extends keyof ApiEnv>(key: K): ApiEnv[K] {
    return this.env[key];
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get isTest(): boolean {
    return this.env.NODE_ENV === 'test';
  }
}
