import { CategoriesService } from './categories.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('CategoriesService (Phase 03 Master Data)', () => {
  let service: CategoriesService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    mockPrisma = {
      category: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      product: {
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockAudit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new CategoriesService(
      mockPrisma as unknown as PrismaService,
      mockAudit as unknown as AuditService,
    );
  });

  describe('create', () => {
    it('should throw ConflictException if category name already exists in tenant', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'existing-cat',
        name: 'Electronics',
      });

      await expect(
        service.create(mockTenantId, { name: 'Electronics' }, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should create category and record audit log', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 'cat-new',
        tenantId: mockTenantId,
        name: 'Raw Materials',
        description: 'Metals and plastics',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(
        mockTenantId,
        { name: 'Raw Materials', description: 'Metals and plastics' },
        mockUserId,
      );

      expect(result.id).toBe('cat-new');
      expect(result.name).toBe('Raw Materials');
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'CATEGORY_CREATED',
        }),
      );
    });
  });

  describe('update', () => {
    it('should prevent deactivation if category has active products', async () => {
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 'cat-1',
        tenantId: mockTenantId,
        status: 'ACTIVE',
      });
      mockPrisma.product.count.mockResolvedValue(5);

      await expect(
        service.update(mockTenantId, 'cat-1', { status: 'INACTIVE' }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
