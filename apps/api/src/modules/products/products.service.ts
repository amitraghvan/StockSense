import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductSchema, UpdateProductSchema } from '@stocksense/validation';
import { Prisma, UnitOfMeasure } from '@prisma/client';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  categoryId?: string;
  unitOfMeasure?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const PRODUCT_SORT_WHITELIST = ['name', 'sku', 'createdAt', 'updatedAt', 'costPrice', 'status'];

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private mapProduct(p: {
    id: string;
    tenantId: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string | null;
    unitOfMeasure: UnitOfMeasure;
    barcode: string | null;
    costPrice: Prisma.Decimal | null;
    salePrice: Prisma.Decimal | null;
    reorderLevel: number | null;
    reorderQty: number | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    category?: { name: string } | null;
  }) {
    return {
      id: p.id,
      tenantId: p.tenantId,
      sku: p.sku,
      name: p.name,
      description: p.description,
      categoryId: p.categoryId,
      categoryName: p.category?.name ?? null,
      unitOfMeasure: p.unitOfMeasure,
      barcode: p.barcode,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      reorderLevel: p.reorderLevel,
      reorderQty: p.reorderQty,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  async findAll(tenantId: string, options: FindAllOptions) {
    const { page, limit, search, status, categoryId, unitOfMeasure, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    const safeSortBy = PRODUCT_SORT_WHITELIST.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.ProductWhereInput = { tenantId };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (unitOfMeasure) where.unitOfMeasure = unitOfMeasure as UnitOfMeasure;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: { category: { select: { name: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((p) => this.mapProduct(p)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: { select: { name: true } } },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return this.mapProduct(product);
  }

  async create(tenantId: string, data: Record<string, unknown>, userId: string) {
    const parsed = CreateProductSchema.parse(data);

    // Check duplicate SKU
    const existing = await this.prisma.product.findUnique({
      where: { tenantId_sku: { tenantId, sku: parsed.sku } },
    });

    if (existing) {
      throw new ConflictException(`A product with SKU "${parsed.sku}" already exists.`);
    }

    // If categoryId is provided, verify it belongs to the tenant
    if (parsed.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: parsed.categoryId, tenantId },
      });
      if (!category) {
        throw new BadRequestException('Category not found in this workspace.');
      }
    }

    const product = await this.prisma.product.create({
      data: {
        tenantId,
        sku: parsed.sku,
        name: parsed.name,
        description: parsed.description ?? null,
        categoryId: parsed.categoryId ?? null,
        unitOfMeasure: parsed.unitOfMeasure as UnitOfMeasure,
        barcode: parsed.barcode ?? null,
        costPrice: parsed.costPrice ?? null,
        salePrice: parsed.salePrice ?? null,
        reorderLevel: parsed.reorderLevel ?? null,
        reorderQty: parsed.reorderQty ?? null,
      },
      include: { category: { select: { name: true } } },
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'PRODUCT_CREATED',
      metadata: { productId: product.id, sku: product.sku, name: product.name },
    });

    return this.mapProduct(product);
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>, userId: string) {
    const parsed = UpdateProductSchema.parse(data);

    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    // If categoryId is provided, verify it belongs to the tenant
    if (parsed.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: parsed.categoryId, tenantId },
      });
      if (!category) {
        throw new BadRequestException('Category not found in this workspace.');
      }
    }

    const updateData: Prisma.ProductUpdateInput = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.categoryId !== undefined) {
      updateData.category = parsed.categoryId
        ? { connect: { id: parsed.categoryId } }
        : { disconnect: true };
    }
    if (parsed.unitOfMeasure !== undefined)
      updateData.unitOfMeasure = parsed.unitOfMeasure as UnitOfMeasure;
    if (parsed.barcode !== undefined) updateData.barcode = parsed.barcode;
    if (parsed.costPrice !== undefined) updateData.costPrice = parsed.costPrice;
    if (parsed.salePrice !== undefined) updateData.salePrice = parsed.salePrice;
    if (parsed.reorderLevel !== undefined) updateData.reorderLevel = parsed.reorderLevel;
    if (parsed.reorderQty !== undefined) updateData.reorderQty = parsed.reorderQty;
    if (parsed.status !== undefined) updateData.status = parsed.status;

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: { select: { name: true } } },
    });

    const auditEvent =
      parsed.status === 'INACTIVE'
        ? 'PRODUCT_DEACTIVATED'
        : parsed.status === 'ACTIVE'
          ? 'PRODUCT_ACTIVATED'
          : 'PRODUCT_UPDATED';

    await this.audit.logEvent({
      userId,
      tenantId,
      event: auditEvent,
      metadata: { productId: updated.id, sku: updated.sku, changes: data },
    });

    return this.mapProduct(updated);
  }
}
