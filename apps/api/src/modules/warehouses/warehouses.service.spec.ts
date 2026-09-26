import { WarehousesService } from './warehouses.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('WarehousesService (Phase 03 Master Data)', () => {
  let service: WarehousesService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    mockPrisma = {
      warehouse: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      location: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockAudit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new WarehousesService(
      mockPrisma as unknown as PrismaService,
      mockAudit as unknown as AuditService,
    );
  });

  describe('create', () => {
    it('should throw ConflictException if warehouse code already exists in tenant', async () => {
      mockPrisma.warehouse.findUnique.mockResolvedValue({
        id: 'wh-1',
        code: 'WH-MAIN',
      });

      await expect(
        service.create(mockTenantId, { name: 'Main Depot', code: 'WH-MAIN' }, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should create warehouse and record audit event', async () => {
      mockPrisma.warehouse.findUnique.mockResolvedValue(null);
      mockPrisma.warehouse.create.mockResolvedValue({
        id: 'wh-new',
        tenantId: mockTenantId,
        name: 'Pune Facility',
        code: 'WH-PUNE',
        address: 'Plot 15',
        description: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(
        mockTenantId,
        { name: 'Pune Facility', code: 'WH-PUNE', address: 'Plot 15' },
        mockUserId,
      );

      expect(result.id).toBe('wh-new');
      expect(result.code).toBe('WH-PUNE');
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'WAREHOUSE_CREATED' }),
      );
    });
  });

  describe('update', () => {
    it('should prevent deactivation when active locations exist', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: 'wh-1',
        tenantId: mockTenantId,
        status: 'ACTIVE',
      });
      mockPrisma.location.count.mockResolvedValue(3);

      await expect(
        service.update(mockTenantId, 'wh-1', { status: 'INACTIVE' }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
