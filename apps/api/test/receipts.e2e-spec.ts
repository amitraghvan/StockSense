import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggerService } from '../src/infrastructure/logging/logger.service';
import { EnvService } from '../src/config/env.service';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Phase 04 — Receipts & Incoming Inventory Operations (E2E)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  const timestamp = Date.now();
  const testUserAlpha = {
    name: 'Receipt Admin Alpha',
    email: `receipt_alpha_${timestamp}@example.com`,
    password: 'Password123!@#',
    tenantName: `Alpha Logistics ${timestamp}`,
  };

  const testUserBeta = {
    name: 'Receipt Admin Beta',
    email: `receipt_beta_${timestamp}@example.com`,
    password: 'Password123!@#',
    tenantName: `Beta Distribution ${timestamp}`,
  };

  let tokenAlpha: string;
  let tenantAlphaId: string;

  let tokenBeta: string;
  let tenantBetaId: string;

  let alphaWarehouseId: string;
  let alphaLocationId: string;
  let alphaProductId: string;

  let betaWarehouseId: string;
  let betaLocationId: string;

  let createdReceiptId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const fastifyAdapter = new FastifyAdapter();
    app = moduleFixture.createNestApplication<NestFastifyApplication>(fastifyAdapter);

    const envService = app.get(EnvService);
    const logger = app.get(LoggerService);

    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new AllExceptionsFilter(logger, envService));
    app.useGlobalInterceptors(new LoggingInterceptor(logger), new TransformInterceptor());

    prisma = app.get(PrismaService);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // 1. Setup Tenant Alpha
    const resAlpha = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: testUserAlpha,
    });
    const dataAlpha = JSON.parse(resAlpha.body).data;
    tokenAlpha = dataAlpha.tokens.accessToken;
    tenantAlphaId = dataAlpha.activeTenant.id;

    // 2. Setup Tenant Beta
    const resBeta = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: testUserBeta,
    });
    const dataBeta = JSON.parse(resBeta.body).data;
    tokenBeta = dataBeta.tokens.accessToken;
    tenantBetaId = dataBeta.activeTenant.id;

    // 3. Create Warehouse, Location, and Product for Alpha directly or via API
    const whAlpha = await prisma.warehouse.create({
      data: {
        tenantId: tenantAlphaId,
        name: 'Alpha Central Depot',
        code: `ACD_${timestamp % 10000}`,
        status: 'ACTIVE',
      },
    });
    alphaWarehouseId = whAlpha.id;

    const locAlpha = await prisma.location.create({
      data: {
        tenantId: tenantAlphaId,
        warehouseId: alphaWarehouseId,
        name: 'Stock Area 1',
        shortCode: 'STK-01',
        status: 'ACTIVE',
      },
    });
    alphaLocationId = locAlpha.id;

    const catAlpha = await prisma.category.create({
      data: {
        tenantId: tenantAlphaId,
        name: 'Office Furniture',
        description: 'Office chairs, desks, and tables',
      },
    });

    const prodAlpha = await prisma.product.create({
      data: {
        tenantId: tenantAlphaId,
        categoryId: catAlpha.id,
        name: 'Ergonomic Desk',
        sku: `DESK_${timestamp % 10000}`,
        unitOfMeasure: 'PCS',
        status: 'ACTIVE',
      },
    });
    alphaProductId = prodAlpha.id;

    // 4. Create Warehouse and Location for Beta
    const whBeta = await prisma.warehouse.create({
      data: {
        tenantId: tenantBetaId,
        name: 'Beta Harbor Hub',
        code: `BHH_${timestamp % 10000}`,
        status: 'ACTIVE',
      },
    });
    betaWarehouseId = whBeta.id;

    const locBeta = await prisma.location.create({
      data: {
        tenantId: tenantBetaId,
        warehouseId: betaWarehouseId,
        name: 'Beta Bay 1',
        shortCode: 'BAY-01',
        status: 'ACTIVE',
      },
    });
    betaLocationId = locBeta.id;
  });

  afterAll(async () => {
    try {
      await prisma.user.deleteMany({
        where: {
          email: { in: [testUserAlpha.email, testUserBeta.email] },
        },
      });
      await prisma.tenant.deleteMany({
        where: {
          id: { in: [tenantAlphaId, tenantBetaId] },
        },
      });
    } catch {
      // Ignore cleanup error
    }
    await app.close();
  });

  describe('1. Receipt Creation & Validation Rules', () => {
    it('POST /api/v1/receipts - should reject if line location belongs to another warehouse', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/receipts',
        headers: { authorization: `Bearer ${tokenAlpha}` },
        payload: {
          warehouseId: alphaWarehouseId,
          supplierName: 'Global Woods Co',
          scheduleDate: new Date().toISOString(),
          lines: [
            {
              productId: alphaProductId,
              locationId: betaLocationId, // Foreign warehouse location
              quantity: 15,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain(
        'destination locations do not belong to the selected warehouse',
      );
    });

    it('POST /api/v1/receipts - should successfully create a DRAFT receipt without changing stock', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/receipts',
        headers: { authorization: `Bearer ${tokenAlpha}` },
        payload: {
          warehouseId: alphaWarehouseId,
          supplierName: 'Azure Interior Supplies',
          contactPerson: 'Alice Vendor',
          scheduleDate: new Date().toISOString(),
          notes: 'Standard delivery batch 1',
          lines: [
            {
              productId: alphaProductId,
              locationId: alphaLocationId,
              quantity: 25,
            },
          ],
        },
      });

      expect(response.statusCode).toBe(201);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.reference).toMatch(/^WH\/IN\/\d{4}$/);
      expect(json.data.status).toBe('DRAFT');
      expect(json.data.lines).toHaveLength(1);
      expect(json.data.lines[0].quantity).toBe(25);

      createdReceiptId = json.data.id;

      // CRITICAL: Verify stock balance was NOT created or incremented in DRAFT
      const balance = await prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: alphaProductId,
            locationId: alphaLocationId,
          },
        },
      });
      expect(balance).toBeNull();
    });

    it('GET /api/v1/receipts - should list receipts with pagination and search', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts?search=${encodeURIComponent('Azure')}`,
        headers: { authorization: `Bearer ${tokenAlpha}` },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.items).toBeInstanceOf(Array);
      expect(json.data.items.length).toBeGreaterThanOrEqual(1);
      expect(json.data.items[0].supplierName).toBe('Azure Interior Supplies');
    });
  });

  describe('2. State Machine: Validation (DRAFT -> READY)', () => {
    it('POST /api/v1/receipts/:id/validate - should transition receipt to READY without modifying stock', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/receipts/${createdReceiptId}/validate`,
        headers: { authorization: `Bearer ${tokenAlpha}` },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('READY');

      // CRITICAL: Stock still must NOT change in READY status
      const balance = await prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: alphaProductId,
            locationId: alphaLocationId,
          },
        },
      });
      expect(balance).toBeNull();
    });
  });

  describe('3. Consequential Execution: Completion (READY -> DONE) & Idempotency', () => {
    it('POST /api/v1/receipts/:id/complete - should atomically increase stock and record stock movement', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/receipts/${createdReceiptId}/complete`,
        headers: { authorization: `Bearer ${tokenAlpha}` },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('DONE');
      expect(json.data.completedAt).toBeDefined();

      // Verify stock balance now exists with exactly 25 units
      const balance = await prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: alphaProductId,
            locationId: alphaLocationId,
          },
        },
      });
      expect(balance).not.toBeNull();
      expect(balance?.quantityOnHand).toBe(25);

      // Verify StockMovement audit ledger entry exists
      const movements = await prisma.stockMovement.findMany({
        where: {
          receiptId: createdReceiptId,
        },
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].quantity).toBe(25);
      expect(movements[0].movementType).toBe('RECEIPT');
    });

    it('POST /api/v1/receipts/:id/complete - should be strictly IDEMPOTENT (no stock duplication on duplicate call)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/receipts/${createdReceiptId}/complete`,
        headers: { authorization: `Bearer ${tokenAlpha}` },
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('DONE');

      // CRITICAL: Stock balance must REMAIN 25 (not 50)
      const balance = await prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: alphaProductId,
            locationId: alphaLocationId,
          },
        },
      });
      expect(balance?.quantityOnHand).toBe(25);

      // No duplicate stock movement ledger records
      const movements = await prisma.stockMovement.findMany({
        where: {
          receiptId: createdReceiptId,
        },
      });
      expect(movements).toHaveLength(1);
    });

    it('POST /api/v1/receipts/:id/complete - Concurrent simultaneous completions increase stock exactly once', async () => {
      // 1. Create a second receipt
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/receipts',
        headers: { authorization: `Bearer ${tokenAlpha}` },
        payload: {
          warehouseId: alphaWarehouseId,
          supplierName: 'Fast Cargo Concurrent',
          scheduleDate: new Date().toISOString(),
          lines: [
            {
              productId: alphaProductId,
              locationId: alphaLocationId,
              quantity: 15,
            },
          ],
        },
      });
      const rec2Id = JSON.parse(createRes.body).data.id;

      // 2. Validate to READY
      await app.inject({
        method: 'POST',
        url: `/api/v1/receipts/${rec2Id}/validate`,
        headers: { authorization: `Bearer ${tokenAlpha}` },
      });

      // Stock before was 25
      const balBefore = await prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: alphaProductId,
            locationId: alphaLocationId,
          },
        },
      });
      const qtyBefore = balBefore?.quantityOnHand || 0;

      // 3. Execute two simultaneous concurrent completion requests
      const [res1, res2] = await Promise.all([
        app.inject({
          method: 'POST',
          url: `/api/v1/receipts/${rec2Id}/complete`,
          headers: { authorization: `Bearer ${tokenAlpha}` },
        }),
        app.inject({
          method: 'POST',
          url: `/api/v1/receipts/${rec2Id}/complete`,
          headers: { authorization: `Bearer ${tokenAlpha}` },
        }),
      ]);

      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      expect(JSON.parse(res1.body).data.status).toBe('DONE');
      expect(JSON.parse(res2.body).data.status).toBe('DONE');

      // CRITICAL: Stock must have increased by exactly 15 (qtyBefore + 15, NOT qtyBefore + 30)
      const balAfter = await prisma.inventoryBalance.findUnique({
        where: {
          productId_locationId: {
            productId: alphaProductId,
            locationId: alphaLocationId,
          },
        },
      });
      expect(balAfter?.quantityOnHand).toBe(qtyBefore + 15);

      // Ledger movement must be exactly 1
      const movements = await prisma.stockMovement.findMany({
        where: {
          receiptId: rec2Id,
        },
      });
      expect(movements).toHaveLength(1);
    });

    it('POST /api/v1/receipts/:id/cancel - should reject cancelling an already completed (DONE) receipt', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/receipts/${createdReceiptId}/cancel`,
        headers: { authorization: `Bearer ${tokenAlpha}` },
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.body);
      expect(json.success).toBe(false);
      expect(json.error.message).toContain('Cannot cancel a completed (DONE) receipt');
    });
  });

  describe('4. Strict Multi-Tenant Isolation', () => {
    it('GET /api/v1/receipts/:id - Tenant Beta cannot view Tenant Alpha receipt', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${createdReceiptId}`,
        headers: { authorization: `Bearer ${tokenBeta}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it('POST /api/v1/receipts/:id/complete - Tenant Beta cannot complete Tenant Alpha receipt', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/receipts/${createdReceiptId}/complete`,
        headers: { authorization: `Bearer ${tokenBeta}` },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
