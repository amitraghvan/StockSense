import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const CATEGORY_SORT_WHITELIST = ['name', 'createdAt', 'updatedAt', 'status'];

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(tenantId: string, options: FindAllOptions) {
    const { page, limit, search, status, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    const safeSortBy = CATEGORY_SORT_WHITELIST.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.CategoryWhereInput = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [{ name: { contains: search, mode: 'insensitive' } }];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: { _count: { select: { products: true } } },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items: items.map((c) => ({
        id: c.id,
        tenantId: c.tenantId,
        name: c.name,
        description: c.description,
        status: c.status,
        productCount: c._count.products,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return {
      id: category.id,
      tenantId: category.tenantId,
      name: category.name,
      description: category.description,
      status: category.status,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async create(
    tenantId: string,
    data: { name: string; description?: string | null },
    userId: string,
  ) {
    // Duplicate check
    const existing = await this.prisma.category.findUnique({
      where: { tenantId_name: { tenantId, name: data.name } },
    });

    if (existing) {
      throw new ConflictException(`A category named "${data.name}" already exists.`);
    }

    const category = await this.prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description ?? null,
      },
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'CATEGORY_CREATED',
      metadata: { categoryId: category.id, name: category.name },
    });

    return {
      id: category.id,
      tenantId: category.tenantId,
      name: category.name,
      description: category.description,
      status: category.status,
      productCount: 0,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string; description?: string | null; status?: 'ACTIVE' | 'INACTIVE' },
    userId: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
    });

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    // Duplicate name check if name is being changed
    if (data.name && data.name !== category.name) {
      const existing = await this.prisma.category.findUnique({
        where: { tenantId_name: { tenantId, name: data.name } },
      });
      if (existing) {
        throw new ConflictException(`A category named "${data.name}" already exists.`);
      }
    }

    // If deactivating, check for active products
    if (data.status === 'INACTIVE' && category.status === 'ACTIVE') {
      const activeProducts = await this.prisma.product.count({
        where: { categoryId: id, tenantId, status: 'ACTIVE' },
      });
      if (activeProducts > 0) {
        throw new BadRequestException(
          `Cannot deactivate category with ${activeProducts} active product(s). Deactivate or reassign products first.`,
        );
      }
    }

    const updateData: Prisma.CategoryUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { products: true } } },
    });

    const auditEvent =
      data.status === 'INACTIVE'
        ? 'CATEGORY_DEACTIVATED'
        : data.status === 'ACTIVE'
          ? 'CATEGORY_ACTIVATED'
          : 'CATEGORY_UPDATED';

    await this.audit.logEvent({
      userId,
      tenantId,
      event: auditEvent,
      metadata: { categoryId: updated.id, name: updated.name, changes: data },
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      name: updated.name,
      description: updated.description,
      status: updated.status,
      productCount: updated._count.products,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
