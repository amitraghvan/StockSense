import { ProductsService } from './products.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProductsService (Phase 03 Master Data)', () => {
  let service: ProductsService;
  let mockPrisma: any;
  let mockAudit: any;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    mockPrisma = {
      product: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    mockAudit = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new ProductsService(
      mockPrisma as unknown as PrismaService,
      mockAudit as unknown as AuditService,
    );
  });

  describe('findAll', () => {
    it('should query products scoped to tenant with pagination', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          tenantId: mockTenantId,
          sku: 'SKU-001',
          name: 'Widget A',
          description: 'A test widget',
          categoryId: 'cat-1',
          category: { name: 'Electronics' },
          unitOfMeasure: 'PCS',
          barcode: null,
          costPrice: { toNumber: () => 10 },
          salePrice: { toNumber: () => 20 },
          reorderLevel: 5,
          reorderQty: 10,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([mockProducts, 1]);

      const result = await service.findAll(mockTenantId, {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].sku).toBe('SKU-001');
      expect(result.items[0].categoryName).toBe('Electronics');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if SKU already exists in tenant', async () => {
      mockPrisma.product.findUnique.mockResolvedValue({
        id: 'existing-prod',
        sku: 'SKU-001',
      });

      await expect(
        service.create(
          mockTenantId,
          {
            sku: 'SKU-001',
            name: 'Widget A',
            unitOfMeasure: 'PCS',
          },
          mockUserId,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should create product and record audit event when valid', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockPrisma.product.create.mockResolvedValue({
        id: 'new-prod',
        tenantId: mockTenantId,
        sku: 'SKU-002',
        name: 'Widget B',
        description: null,
        categoryId: null,
        category: null,
        unitOfMeasure: 'PCS',
        barcode: null,
        costPrice: null,
        salePrice: null,
        reorderLevel: null,
        reorderQty: null,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(
        mockTenantId,
        {
          sku: 'SKU-002',
          name: 'Widget B',
          unitOfMeasure: 'PCS',
        },
        mockUserId,
      );

      expect(result.id).toBe('new-prod');
      expect(result.sku).toBe('SKU-002');
      expect(mockAudit.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          tenantId: mockTenantId,
          event: 'PRODUCT_CREATED',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if product does not exist in tenant', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, 'missing-id')).rejects.toThrow(NotFoundException);
    });
  });
});
