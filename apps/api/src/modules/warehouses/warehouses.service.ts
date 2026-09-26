import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWarehouseSchema, UpdateWarehouseSchema } from '@stocksense/validation';
import { Prisma } from '@prisma/client';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const WAREHOUSE_SORT_WHITELIST = ['name', 'code', 'createdAt', 'updatedAt', 'status'];

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(tenantId: string, options: FindAllOptions) {
    const { page, limit, search, status, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    const safeSortBy = WAREHOUSE_SORT_WHITELIST.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.WarehouseWhereInput = { tenantId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: { _count: { select: { locations: true } } },
      }),
      this.prisma.warehouse.count({ where }),
    ]);

    return {
      items: items.map((w) => ({
        id: w.id,
        tenantId: w.tenantId,
        name: w.name,
        code: w.code,
        address: w.address,
        description: w.description,
        status: w.status,
        locationCount: w._count.locations,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
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
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { locations: true } } },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found.');
    }

    return {
      id: warehouse.id,
      tenantId: warehouse.tenantId,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      description: warehouse.description,
      status: warehouse.status,
      locationCount: warehouse._count.locations,
      createdAt: warehouse.createdAt.toISOString(),
      updatedAt: warehouse.updatedAt.toISOString(),
    };
  }

  async create(tenantId: string, data: Record<string, unknown>, userId: string) {
    const parsed = CreateWarehouseSchema.parse(data);

    // Check duplicate code
    const existing = await this.prisma.warehouse.findUnique({
      where: { tenantId_code: { tenantId, code: parsed.code } },
    });

    if (existing) {
      throw new ConflictException(`A warehouse with code "${parsed.code}" already exists.`);
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        tenantId,
        name: parsed.name,
        code: parsed.code,
        address: parsed.address ?? null,
        description: parsed.description ?? null,
      },
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'WAREHOUSE_CREATED',
      metadata: { warehouseId: warehouse.id, code: warehouse.code, name: warehouse.name },
    });

    return {
      id: warehouse.id,
      tenantId: warehouse.tenantId,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      description: warehouse.description,
      status: warehouse.status,
      locationCount: 0,
      createdAt: warehouse.createdAt.toISOString(),
      updatedAt: warehouse.updatedAt.toISOString(),
    };
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>, userId: string) {
    const parsed = UpdateWarehouseSchema.parse(data);

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found.');
    }

    // If deactivating, check for active locations
    if (parsed.status === 'INACTIVE' && warehouse.status === 'ACTIVE') {
      const activeLocations = await this.prisma.location.count({
        where: { warehouseId: id, tenantId, status: 'ACTIVE' },
      });
      if (activeLocations > 0) {
        throw new BadRequestException(
          `Cannot deactivate warehouse with ${activeLocations} active location(s). Deactivate locations first.`,
        );
      }
    }

    const updateData: Prisma.WarehouseUpdateInput = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.address !== undefined) updateData.address = parsed.address;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.status !== undefined) updateData.status = parsed.status;

    const updated = await this.prisma.warehouse.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { locations: true } } },
    });

    const auditEvent =
      parsed.status === 'INACTIVE'
        ? 'WAREHOUSE_DEACTIVATED'
        : parsed.status === 'ACTIVE'
          ? 'WAREHOUSE_ACTIVATED'
          : 'WAREHOUSE_UPDATED';

    await this.audit.logEvent({
      userId,
      tenantId,
      event: auditEvent,
      metadata: { warehouseId: updated.id, code: updated.code, changes: data },
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      name: updated.name,
      code: updated.code,
      address: updated.address,
      description: updated.description,
      status: updated.status,
      locationCount: updated._count.locations,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getLocations(
    tenantId: string,
    warehouseId: string,
    options: { page: number; limit: number; search?: string; status?: 'ACTIVE' | 'INACTIVE' },
  ) {
    // Verify warehouse belongs to tenant
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found.');
    }

    const { page, limit, search, status } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.LocationWhereInput = { tenantId, warehouseId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.location.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { warehouse: { select: { name: true, code: true } } },
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      items: items.map((l) => ({
        id: l.id,
        tenantId: l.tenantId,
        warehouseId: l.warehouseId,
        warehouseName: l.warehouse.name,
        warehouseCode: l.warehouse.code,
        name: l.name,
        shortCode: l.shortCode,
        description: l.description,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
