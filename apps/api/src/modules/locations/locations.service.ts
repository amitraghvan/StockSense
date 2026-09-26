import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLocationSchema, UpdateLocationSchema } from '@stocksense/validation';
import { Prisma } from '@prisma/client';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  warehouseId?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const LOCATION_SORT_WHITELIST = ['name', 'shortCode', 'createdAt', 'updatedAt', 'status'];

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(tenantId: string, options: FindAllOptions) {
    const { page, limit, search, status, warehouseId, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    const safeSortBy = LOCATION_SORT_WHITELIST.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.LocationWhereInput = { tenantId };
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;
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
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          warehouse: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      items: items.map((loc) => ({
        id: loc.id,
        tenantId: loc.tenantId,
        warehouseId: loc.warehouseId,
        warehouseName: loc.warehouse.name,
        warehouseCode: loc.warehouse.code,
        name: loc.name,
        shortCode: loc.shortCode,
        description: loc.description,
        status: loc.status,
        createdAt: loc.createdAt.toISOString(),
        updatedAt: loc.updatedAt.toISOString(),
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
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    return {
      id: location.id,
      tenantId: location.tenantId,
      warehouseId: location.warehouseId,
      warehouseName: location.warehouse.name,
      warehouseCode: location.warehouse.code,
      name: location.name,
      shortCode: location.shortCode,
      description: location.description,
      status: location.status,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }

  async create(tenantId: string, data: Record<string, unknown>, userId: string) {
    const parsed = CreateLocationSchema.parse(data);

    // Verify warehouse belongs to the current tenant
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: parsed.warehouseId, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found or belongs to another organization.');
    }

    if (warehouse.status === 'INACTIVE') {
      throw new BadRequestException('Cannot create a location in an inactive warehouse.');
    }

    // Check duplicate shortCode in this warehouse
    const existing = await this.prisma.location.findUnique({
      where: {
        warehouseId_shortCode: {
          warehouseId: parsed.warehouseId,
          shortCode: parsed.shortCode,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A location with short code "${parsed.shortCode}" already exists in this warehouse.`,
      );
    }

    const location = await this.prisma.location.create({
      data: {
        tenantId,
        warehouseId: parsed.warehouseId,
        name: parsed.name,
        shortCode: parsed.shortCode,
        description: parsed.description ?? null,
      },
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'LOCATION_CREATED',
      metadata: {
        locationId: location.id,
        warehouseId: location.warehouseId,
        shortCode: location.shortCode,
        name: location.name,
      },
    });

    return {
      id: location.id,
      tenantId: location.tenantId,
      warehouseId: location.warehouseId,
      warehouseName: location.warehouse.name,
      warehouseCode: location.warehouse.code,
      name: location.name,
      shortCode: location.shortCode,
      description: location.description,
      status: location.status,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    };
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>, userId: string) {
    const parsed = UpdateLocationSchema.parse(data);

    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!location) {
      throw new NotFoundException('Location not found.');
    }

    const updateData: Prisma.LocationUpdateInput = {};
    if (parsed.name !== undefined) updateData.name = parsed.name;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.status !== undefined) updateData.status = parsed.status;

    const updated = await this.prisma.location.update({
      where: { id },
      data: updateData,
      include: {
        warehouse: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const auditEvent = parsed.status === 'INACTIVE' ? 'LOCATION_DEACTIVATED' : 'LOCATION_UPDATED';

    await this.audit.logEvent({
      userId,
      tenantId,
      event: auditEvent,
      metadata: {
        locationId: updated.id,
        warehouseId: updated.warehouseId,
        changes: parsed,
      },
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      warehouseId: updated.warehouseId,
      warehouseName: updated.warehouse.name,
      warehouseCode: updated.warehouse.code,
      name: updated.name,
      shortCode: updated.shortCode,
      description: updated.description,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
