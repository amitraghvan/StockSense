import { ReceiptsService } from './receipts.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('ReceiptsService (Phase 04 Receipts & Inventory Operations)', () => {
  let service: ReceiptsService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockTenantId = '11111111-1111-4111-8111-111111111111';
  const mockUserId = '22222222-2222-4222-8222-222222222222';
  const mockWarehouseId = '33333333-3333-4333-8333-333333333333';
  const mockLocationId = '44444444-4444-4444-8444-444444444444';
  const mockProductId = '55555555-5555-4555-8555-555555555555';

  const createMockReceipt = (overrides: Record<string, unknown> = {}) => ({
    id: 'rec-001',
    tenantId: mockTenantId,
    reference: 'WH/IN/0001',
    warehouseId: mockWarehouseId,
    supplierName: 'Azure Interior',
    contactPerson: 'John Doe',
    responsibleUserId: mockUserId,
    scheduleDate: new Date('2026-10-01T10:00:00.000Z'),
    status: 'DRAFT',
    notes: 'Initial delivery',
    completedAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    warehouse: {
      id: mockWarehouseId,
      name: 'Main Warehouse',
      code: 'WH',
    },
    responsibleUser: {
      id: mockUserId,
      name: 'Admin User',
      email: 'admin@stocksense.dev',
    },
    lines: [
      {
        id: 'line-001',
        receiptId: 'rec-001',
        productId: mockProductId,
        locationId: mockLocationId,
        quantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: mockProductId,
          name: 'Desk',
          sku: 'DESK-01',
          unitOfMeasure: 'PCS',
        },
        location: {
          id: mockLocationId,
          name: 'Stock 1',
          code: 'STOCK-01',
          warehouseId: mockWarehouseId,
        },
      },
    ],
    ...overrides,
  });

  beforeEach(() => {
    mockPrisma = {
      receipt: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      receiptLine: {
        create: jest.fn(),
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      receiptSequence: {
        upsert: jest.fn(),
      },
      warehouse: {
        findFirst: jest.fn(),
      },
      location: {
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
      inventoryBalance: {
        upsert: jest.fn(),
      },
      stockMovement: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    mockAudit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new ReceiptsService(
      mockPrisma as unknown as PrismaService,
      mockAudit as unknown as AuditService,
    );
  });

  describe('generateReference', () => {
    it('should generate formatted sequential references safely scoped to tenant', async () => {
      mockPrisma.receiptSequence.upsert.mockResolvedValue({
        tenantId: mockTenantId,
        prefix: 'WH/IN',
        lastValue: 42,
      });

      const ref = await service.generateReference(mockPrisma, mockTenantId, 'WH/IN');
      expect(ref).toBe('WH/IN/0042');
      expect(mockPrisma.receiptSequence.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_prefix: {
            tenantId: mockTenantId,
            prefix: 'WH/IN',
          },
        },
        update: {
          lastValue: { increment: 1 },
        },
        create: {
          tenantId: mockTenantId,
          prefix: 'WH/IN',
          lastValue: 1,
        },
      });
    });
  });

  describe('create receipt', () => {
    const validDto = {
      warehouseId: mockWarehouseId,
      supplierName: 'Azure Interior',
      scheduleDate: '2026-10-01T10:00:00.000Z',
      notes: 'Initial delivery',
      lines: [
        {
          productId: mockProductId,
          locationId: mockLocationId,
          quantity: 10,
        },
      ],
    };

    it('should create receipt in DRAFT status without modifying stock balances', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        tenantId: mockTenantId,
        status: 'ACTIVE',
      });

      mockPrisma.product.findMany.mockResolvedValue([
        { id: mockProductId, tenantId: mockTenantId, status: 'ACTIVE' },
      ]);

      mockPrisma.location.findMany.mockResolvedValue([
        {
          id: mockLocationId,
          warehouseId: mockWarehouseId,
          tenantId: mockTenantId,
          status: 'ACTIVE',
        },
      ]);

      mockPrisma.receiptSequence.upsert.mockResolvedValue({
        tenantId: mockTenantId,
        prefix: 'WH/IN',
        lastValue: 1,
      });

      const rawReceipt = createMockReceipt();
      mockPrisma.receipt.create.mockResolvedValue(rawReceipt);
      mockPrisma.receipt.findFirst.mockResolvedValue(rawReceipt);

      const result = await service.create(mockTenantId, validDto, mockUserId);

      expect(result.reference).toBe('WH/IN/0001');
      expect(result.status).toBe('DRAFT');
      // Critical check: inventoryBalance was NOT modified during creation
      expect(mockPrisma.inventoryBalance.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'RECEIPT_CREATED' }),
      );
    });

    it('should reject receipt creation if location does not belong to the selected warehouse', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        tenantId: mockTenantId,
        status: 'ACTIVE',
      });

      mockPrisma.product.findMany.mockResolvedValue([
        { id: mockProductId, tenantId: mockTenantId, status: 'ACTIVE' },
      ]);

      // When querying for locations matching this warehouse, none are found
      mockPrisma.location.findMany.mockResolvedValue([]);

      await expect(service.create(mockTenantId, validDto, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject receipt creation if any product is inactive', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        tenantId: mockTenantId,
        status: 'ACTIVE',
      });

      mockPrisma.product.findMany.mockResolvedValue([
        { id: mockProductId, tenantId: mockTenantId, status: 'INACTIVE' },
      ]);

      mockPrisma.location.findMany.mockResolvedValue([
        {
          id: mockLocationId,
          warehouseId: mockWarehouseId,
          tenantId: mockTenantId,
          status: 'ACTIVE',
        },
      ]);

      await expect(service.create(mockTenantId, validDto, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateReceipt (State transition: DRAFT -> READY)', () => {
    it('should move receipt from DRAFT to READY without altering inventory balances', async () => {
      const draftReceipt = createMockReceipt({ status: 'DRAFT' });
      const readyReceipt = createMockReceipt({ status: 'READY' });

      mockPrisma.receipt.findFirst
        .mockResolvedValueOnce(draftReceipt)
        .mockResolvedValueOnce(readyReceipt);
      mockPrisma.receipt.update.mockResolvedValue({ ...draftReceipt, status: 'READY' });

      const result = await service.validateReceipt(mockTenantId, 'rec-001', mockUserId);

      expect(mockPrisma.receipt.update).toHaveBeenCalledWith({
        where: { id: 'rec-001' },
        data: { status: 'READY' },
      });
      // Critical check: Stock remains untouched in READY state
      expect(mockPrisma.inventoryBalance.upsert).not.toHaveBeenCalled();
      expect(result.status).toBe('READY');
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'RECEIPT_VALIDATED' }),
      );
    });

    it('should reject validation if receipt is already DONE or CANCELLED', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(createMockReceipt({ status: 'DONE' }));

      await expect(service.validateReceipt(mockTenantId, 'rec-001', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeReceipt (State transition: READY -> DONE)', () => {
    it('should atomically transition to DONE, increase inventory balance, and write stock movement', async () => {
      const readyReceipt = createMockReceipt({ status: 'READY' });
      const doneReceipt = createMockReceipt({ status: 'DONE', completedAt: new Date() });

      mockPrisma.receipt.findFirst
        .mockResolvedValueOnce(readyReceipt)
        .mockResolvedValueOnce(doneReceipt);
      mockPrisma.receipt.update.mockResolvedValue(doneReceipt);

      const result = await service.completeReceipt(mockTenantId, 'rec-001', mockUserId);

      // Verify atomic inventory balance upsert
      expect(mockPrisma.inventoryBalance.upsert).toHaveBeenCalledWith({
        where: {
          productId_locationId: {
            productId: mockProductId,
            locationId: mockLocationId,
          },
        },
        create: {
          tenantId: mockTenantId,
          productId: mockProductId,
          locationId: mockLocationId,
          quantityOnHand: 10,
        },
        update: {
          quantityOnHand: { increment: 10 },
        },
      });

      // Verify stock movement ledger entry
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          receiptId: 'rec-001',
          productId: mockProductId,
          locationId: mockLocationId,
          quantity: 10,
          movementType: 'RECEIPT',
          reference: 'WH/IN/0001',
          performedBy: mockUserId,
        },
      });

      expect(result.status).toBe('DONE');

      // Verify audit record
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'RECEIPT_COMPLETED' }),
      );
    });

    it('should be strictly idempotent: secondary completion calls do not re-increment stock', async () => {
      const alreadyDoneReceipt = createMockReceipt({ status: 'DONE', completedAt: new Date() });

      mockPrisma.receipt.findFirst.mockResolvedValue(alreadyDoneReceipt);

      const result = await service.completeReceipt(mockTenantId, 'rec-001', mockUserId);

      // Idempotency: Stock must NOT be incremented again!
      expect(mockPrisma.inventoryBalance.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.stockMovement.create).not.toHaveBeenCalled();
      expect(mockPrisma.receipt.update).not.toHaveBeenCalled();
      expect(result.status).toBe('DONE');
    });

    it('should reject completion if receipt is still in DRAFT status', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(createMockReceipt({ status: 'DRAFT' }));

      await expect(service.completeReceipt(mockTenantId, 'rec-001', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelReceipt', () => {
    it('should cancel a DRAFT receipt', async () => {
      const draftReceipt = createMockReceipt({ status: 'DRAFT' });
      const cancelledReceipt = createMockReceipt({ status: 'CANCELLED', cancelledAt: new Date() });

      mockPrisma.receipt.findFirst
        .mockResolvedValueOnce(draftReceipt)
        .mockResolvedValueOnce(cancelledReceipt);

      const result = await service.cancelReceipt(
        mockTenantId,
        'rec-001',
        mockUserId,
        'Vendor cancelled shipment',
      );

      expect(mockPrisma.receipt.update).toHaveBeenCalledWith({
        where: { id: 'rec-001' },
        data: expect.objectContaining({
          status: 'CANCELLED',
        }),
      });
      expect(result.status).toBe('CANCELLED');
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'RECEIPT_CANCELLED' }),
      );
    });

    it('should reject cancellation if receipt is already DONE', async () => {
      mockPrisma.receipt.findFirst.mockResolvedValue(createMockReceipt({ status: 'DONE' }));

      await expect(service.cancelReceipt(mockTenantId, 'rec-001', mockUserId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
