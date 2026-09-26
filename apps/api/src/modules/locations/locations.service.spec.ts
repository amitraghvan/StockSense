import { LocationsService } from './locations.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('LocationsService (Phase 03 Master Data)', () => {
  let service: LocationsService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    mockPrisma = {
      location: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      warehouse: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockAudit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new LocationsService(
      mockPrisma as unknown as PrismaService,
      mockAudit as unknown as AuditService,
    );
  });

  describe('create', () => {
    const mockWarehouseId = '11111111-1111-4111-a111-111111111111';

    it('should throw NotFoundException if warehouse does not belong to tenant', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          mockTenantId,
          {
            warehouseId: mockWarehouseId,
            name: 'Bin 101',
            shortCode: 'B101',
          },
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if shortCode exists in same warehouse', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        tenantId: mockTenantId,
        status: 'ACTIVE',
      });
      mockPrisma.location.findUnique.mockResolvedValue({
        id: 'loc-1',
        shortCode: 'B101',
      });

      await expect(
        service.create(
          mockTenantId,
          {
            warehouseId: mockWarehouseId,
            name: 'Bin 101 Duplicate',
            shortCode: 'B101',
          },
          mockUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create location successfully when inputs are valid', async () => {
      mockPrisma.warehouse.findFirst.mockResolvedValue({
        id: mockWarehouseId,
        name: 'Main WH',
        code: 'WH-MAIN',
        tenantId: mockTenantId,
        status: 'ACTIVE',
      });
      mockPrisma.location.findUnique.mockResolvedValue(null);
      mockPrisma.location.create.mockResolvedValue({
        id: 'loc-new',
        tenantId: mockTenantId,
        warehouseId: mockWarehouseId,
        name: 'Aisle 1 Rack A',
        shortCode: 'A1-RA',
        description: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        warehouse: { id: mockWarehouseId, name: 'Main WH', code: 'WH-MAIN' },
      });

      const result = await service.create(
        mockTenantId,
        {
          warehouseId: mockWarehouseId,
          name: 'Aisle 1 Rack A',
          shortCode: 'A1-RA',
        },
        mockUserId,
      );

      expect(result.id).toBe('loc-new');
      expect(result.shortCode).toBe('A1-RA');
      expect(result.warehouseName).toBe('Main WH');
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'LOCATION_CREATED' }),
      );
    });
  });
});
