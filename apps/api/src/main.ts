import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { randomUUID } from 'crypto';
import { AppModule } from './app.module';
import { EnvService } from './config/env.service';
import { LoggerService } from './infrastructure/logging/logger.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({
    genReqId: (req: { headers: Record<string, string | string[] | undefined> }) => {
      const headerReqId = req.headers['x-request-id'];
      if (headerReqId && typeof headerReqId === 'string') {
        return headerReqId;
      }
      return randomUUID();
    },
    requestIdHeader: 'x-request-id',
    bodyLimit: 10485760, // 10MB body limit
  });

  fastifyAdapter.getInstance().addHook('onSend', (request, reply, _payload, done) => {
    reply.header('x-request-id', request.id);
    done();
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
    bufferLogs: true,
  });

  const envService = app.get(EnvService);
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter(logger, envService));
  app.useGlobalInterceptors(new LoggingInterceptor(logger), new TransformInterceptor());

  // Security: Helmet HTTP Headers
  await app.register(fastifyHelmet as unknown as Parameters<typeof app.register>[0], {
    contentSecurityPolicy: envService.isProduction ? undefined : false,
  });

  // Security: CORS Configuration
  const corsOrigin = envService.get('CORS_ORIGIN');
  await app.register(fastifyCors as unknown as Parameters<typeof app.register>[0], {
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Accept'],
    exposedHeaders: ['X-Request-Id'],
  });

  // API Versioning Prefix (/api/v1)
  const apiPrefix = envService.get('API_PREFIX');
  app.setGlobalPrefix(apiPrefix);

  // OpenAPI / Swagger Documentation (/docs)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('StockSense API')
    .setDescription(
      'StockSense Production Engineering Foundation — Modular Monolith Inventory & SaaS Platform API',
    )
    .setVersion(envService.get('APP_VERSION'))
    .addTag('Health & Observability', 'Liveness, readiness, and service diagnostics')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    customSiteTitle: 'StockSense API Docs',
  });

  // Graceful Shutdown
  app.enableShutdownHooks();

  const port = envService.get('PORT');
  const host = envService.get('HOST');

  await app.listen(port, host);
  logger.log(`StockSense API server running at http://${host}:${port}/${apiPrefix}`, 'Bootstrap');
  logger.log(`Swagger OpenAPI documentation available at http://${host}:${port}/docs`, 'Bootstrap');
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap failure:', err);
  process.exit(1);
});
