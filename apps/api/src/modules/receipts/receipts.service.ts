import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReceiptSchema, UpdateReceiptSchema } from '@stocksense/validation';
import { Prisma, ReceiptStatus } from '@prisma/client';

interface FindAllReceiptOptions {
  page: number;
  limit: number;
  search?: string;
  status?: ReceiptStatus;
  warehouseId?: string;
  scheduleDate?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const RECEIPT_SORT_WHITELIST = ['reference', 'scheduleDate', 'createdAt', 'status', 'supplierName'];

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Concurrency-safe, tenant-scoped receipt reference generator.
   * Increments the tenant's sequence counter atomically in a transaction.
   * Generates references such as: WH/IN/0001
   */
  async generateReference(
    tx: Prisma.TransactionClient,
    tenantId: string,
    prefix = 'WH/IN',
  ): Promise<string> {
    const seq = await tx.receiptSequence.upsert({
      where: {
        tenantId_prefix: {
          tenantId,
          prefix,
        },
      },
      update: {
        lastValue: { increment: 1 },
      },
      create: {
        tenantId,
        prefix,
        lastValue: 1,
      },
    });

    return `${seq.prefix}/${String(seq.lastValue).padStart(4, '0')}`;
  }

  async findAll(tenantId: string, options: FindAllReceiptOptions) {
    const { page, limit, search, status, warehouseId, scheduleDate, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;
    const safeSortBy = RECEIPT_SORT_WHITELIST.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.ReceiptWhereInput = { tenantId };
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;
    if (scheduleDate) {
      const d = new Date(scheduleDate);
      const nextDay = new Date(d);
      nextDay.setDate(d.getDate() + 1);
      where.scheduleDate = { gte: d, lt: nextDay };
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { supplierName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.receipt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: sortOrder },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          responsibleUser: { select: { id: true, name: true, email: true } },
          _count: { select: { lines: true } },
        },
      }),
      this.prisma.receipt.count({ where }),
    ]);

    const now = new Date();

    return {
      items: items.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        reference: r.reference,
        warehouseId: r.warehouseId,
        warehouseName: r.warehouse.name,
        warehouseCode: r.warehouse.code,
        supplierName: r.supplierName,
        contactPerson: r.contactPerson,
        responsibleUserId: r.responsibleUserId,
        responsibleUserName: r.responsibleUser?.name || null,
        scheduleDate: r.scheduleDate.toISOString(),
        status: r.status,
        notes: r.notes,
        lineCount: r._count.lines,
        isLate: r.scheduleDate < now && r.status !== 'DONE' && r.status !== 'CANCELLED',
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
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
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, tenantId },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
        responsibleUser: { select: { id: true, name: true, email: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
            location: { select: { id: true, name: true, shortCode: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found or belongs to another organization.');
    }

    const now = new Date();

    return {
      id: receipt.id,
      tenantId: receipt.tenantId,
      reference: receipt.reference,
      warehouseId: receipt.warehouseId,
      warehouseName: receipt.warehouse?.name || '',
      warehouseCode: receipt.warehouse?.code || '',
      supplierName: receipt.supplierName,
      contactPerson: receipt.contactPerson,
      responsibleUserId: receipt.responsibleUserId,
      responsibleUserName: receipt.responsibleUser?.name || null,
      scheduleDate: receipt.scheduleDate.toISOString(),
      status: receipt.status,
      notes: receipt.notes,
      isLate:
        receipt.scheduleDate < now && receipt.status !== 'DONE' && receipt.status !== 'CANCELLED',
      completedAt: receipt.completedAt ? receipt.completedAt.toISOString() : null,
      cancelledAt: receipt.cancelledAt ? receipt.cancelledAt.toISOString() : null,
      createdAt: receipt.createdAt.toISOString(),
      updatedAt: receipt.updatedAt.toISOString(),
      lines: receipt.lines.map((line) => ({
        id: line.id,
        receiptId: line.receiptId,
        productId: line.productId,
        productName: line.product.name,
        productSku: line.product.sku,
        locationId: line.locationId,
        locationName: line.location.name,
        locationShortCode: line.location.shortCode,
        quantity: line.quantity,
        unitOfMeasure: line.product.unitOfMeasure,
        createdAt: line.createdAt.toISOString(),
        updatedAt: line.updatedAt.toISOString(),
      })),
    };
  }

  async create(tenantId: string, data: Record<string, unknown>, userId: string) {
    const parsed = CreateReceiptSchema.parse(data);

    // 1. Verify warehouse belongs to tenant and is ACTIVE
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: parsed.warehouseId, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException(
        'Selected warehouse does not exist or belongs to another organization.',
      );
    }
    if (warehouse.status === 'INACTIVE') {
      throw new BadRequestException('Cannot create receipt for an inactive warehouse.');
    }

    // 2. Validate all products and locations in lines
    await this.validateReceiptLines(tenantId, parsed.warehouseId, parsed.lines);

    // 3. Create receipt and lines in a single database transaction with sequence numbering
    const receipt = await this.prisma.$transaction(async (tx) => {
      const reference = await this.generateReference(tx, tenantId);

      return tx.receipt.create({
        data: {
          tenantId,
          reference,
          warehouseId: parsed.warehouseId,
          supplierName: parsed.supplierName,
          contactPerson: parsed.contactPerson || null,
          responsibleUserId: userId,
          scheduleDate: new Date(parsed.scheduleDate),
          status: 'DRAFT',
          notes: parsed.notes || null,
          lines: {
            create: parsed.lines.map((line) => ({
              tenantId,
              productId: line.productId,
              locationId: line.locationId,
              quantity: line.quantity,
            })),
          },
        },
        include: {
          warehouse: { select: { id: true, name: true, code: true } },
          responsibleUser: { select: { id: true, name: true, email: true } },
          lines: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              location: { select: { id: true, name: true, shortCode: true } },
            },
          },
        },
      });
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'RECEIPT_CREATED',
      metadata: {
        receiptId: receipt.id,
        reference: receipt.reference,
        warehouseId: receipt.warehouseId,
        supplierName: receipt.supplierName,
        lineCount: receipt.lines.length,
      },
    });

    return this.findOne(tenantId, receipt.id);
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>, userId: string) {
    const parsed = UpdateReceiptSchema.parse(data);

    const existing = await this.prisma.receipt.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Receipt not found.');
    }

    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot edit receipt in ${existing.status} status. Only DRAFT receipts can be modified.`,
      );
    }

    const warehouseId = parsed.warehouseId || existing.warehouseId;

    if (parsed.warehouseId && parsed.warehouseId !== existing.warehouseId) {
      const wh = await this.prisma.warehouse.findFirst({
        where: { id: parsed.warehouseId, tenantId },
      });
      if (!wh || wh.status === 'INACTIVE') {
        throw new BadRequestException('Selected warehouse is invalid or inactive.');
      }
    }

    if (parsed.lines) {
      await this.validateReceiptLines(tenantId, warehouseId, parsed.lines);
    }

    await this.prisma.$transaction(async (tx) => {
      // If lines updated, delete existing and re-insert
      if (parsed.lines) {
        await tx.receiptLine.deleteMany({ where: { receiptId: id } });
        await tx.receiptLine.createMany({
          data: parsed.lines.map((l) => ({
            tenantId,
            receiptId: id,
            productId: l.productId,
            locationId: l.locationId,
            quantity: l.quantity,
          })),
        });
      }

      await tx.receipt.update({
        where: { id },
        data: {
          warehouseId: parsed.warehouseId || undefined,
          supplierName: parsed.supplierName || undefined,
          contactPerson: parsed.contactPerson !== undefined ? parsed.contactPerson : undefined,
          scheduleDate: parsed.scheduleDate ? new Date(parsed.scheduleDate) : undefined,
          notes: parsed.notes !== undefined ? parsed.notes : undefined,
        },
      });
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'RECEIPT_UPDATED',
      metadata: { receiptId: id, reference: existing.reference },
    });

    return this.findOne(tenantId, id);
  }

  /**
   * Command: Validate Receipt (DRAFT -> READY)
   * Signals that incoming goods are ready to be physically received.
   * Does NOT affect stock!
   */
  async validateReceipt(tenantId: string, id: string, userId: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found.');
    }

    if (receipt.status === 'READY') {
      return this.findOne(tenantId, id);
    }

    if (receipt.status !== 'DRAFT') {
      throw new BadRequestException(
        `Cannot validate receipt in ${receipt.status} status. Only DRAFT receipts can become READY.`,
      );
    }

    if (receipt.lines.length === 0) {
      throw new BadRequestException('Cannot validate receipt with no product lines.');
    }

    await this.prisma.receipt.update({
      where: { id },
      data: { status: 'READY' },
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'RECEIPT_VALIDATED',
      metadata: { receiptId: id, reference: receipt.reference, transition: 'DRAFT_TO_READY' },
    });

    return this.findOne(tenantId, id);
  }

  /**
   * Command: Complete Receipt (READY -> DONE)
   * ATOMICALLY INCREASES INVENTORY in a single database transaction.
   * Idempotent: If already DONE, returns without double-incrementing stock.
   */
  async completeReceipt(tenantId: string, id: string, userId: string) {
    const auditPayload = await this.prisma.$transaction(async (tx) => {
      // 1. Lock and check current receipt status
      const receipt = await tx.receipt.findFirst({
        where: { id, tenantId },
        include: { lines: true },
      });

      if (!receipt) {
        throw new NotFoundException('Receipt not found.');
      }

      // Idempotency: If already completed, return existing without re-mutating stock
      if (receipt.status === 'DONE') {
        return null;
      }

      if (receipt.status !== 'READY') {
        throw new BadRequestException(
          `Cannot complete receipt in ${receipt.status} status. Receipt must be in READY status before completion.`,
        );
      }

      if (receipt.lines.length === 0) {
        throw new BadRequestException('Receipt has no product lines to receive.');
      }

      const completedAt = new Date();

      // 2. Atomically increment InventoryBalance for each receipt line
      for (const line of receipt.lines) {
        await tx.inventoryBalance.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: line.locationId,
            },
          },
          update: {
            quantityOnHand: { increment: line.quantity },
          },
          create: {
            tenantId,
            productId: line.productId,
            locationId: line.locationId,
            quantityOnHand: line.quantity,
          },
        });

        // 3. Create immutable StockMovement ledger entry
        await tx.stockMovement.create({
          data: {
            tenantId,
            receiptId: receipt.id,
            productId: line.productId,
            locationId: line.locationId,
            quantity: line.quantity,
            movementType: 'RECEIPT',
            reference: receipt.reference,
            performedBy: userId,
          },
        });
      }

      // 4. Mark receipt status DONE
      await tx.receipt.update({
        where: { id },
        data: {
          status: 'DONE',
          completedAt,
        },
      });

      return {
        receiptId: receipt.id,
        reference: receipt.reference,
        warehouseId: receipt.warehouseId,
        lineCount: receipt.lines.length,
        totalUnitsReceived: receipt.lines.reduce((acc, l) => acc + l.quantity, 0),
        completedAt: completedAt.toISOString(),
      };
    });

    if (auditPayload) {
      await this.audit.logEvent({
        userId,
        tenantId,
        event: 'RECEIPT_COMPLETED',
        metadata: auditPayload,
      });
    }

    return this.findOne(tenantId, id);
  }

  /**
   * Command: Cancel Receipt (DRAFT/READY -> CANCELLED)
   */
  async cancelReceipt(tenantId: string, id: string, userId: string, reason?: string) {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, tenantId },
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found.');
    }

    if (receipt.status === 'DONE') {
      throw new BadRequestException(
        'Cannot cancel a completed (DONE) receipt. Inventory has already been received.',
      );
    }

    if (receipt.status === 'CANCELLED') {
      return this.findOne(tenantId, id);
    }

    const cancelledAt = new Date();

    await this.prisma.receipt.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt,
        notes: reason ? `${receipt.notes || ''}\n[Cancelled]: ${reason}`.trim() : receipt.notes,
      },
    });

    await this.audit.logEvent({
      userId,
      tenantId,
      event: 'RECEIPT_CANCELLED',
      metadata: {
        receiptId: id,
        reference: receipt.reference,
        cancelledAt: cancelledAt.toISOString(),
        reason,
      },
    });

    return this.findOne(tenantId, id);
  }

  /**
   * Helper: Validates all product line references for cross-tenant isolation and warehouse consistency.
   */
  private async validateReceiptLines(
    tenantId: string,
    warehouseId: string,
    lines: { productId: string; locationId: string; quantity: number }[],
  ) {
    const productIds = Array.from(new Set(lines.map((l) => l.productId)));
    const locationIds = Array.from(new Set(lines.map((l) => l.locationId)));

    // Verify products
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more selected products do not exist or belong to another organization.',
      );
    }

    const inactiveProduct = products.find((p) => p.status === 'INACTIVE');
    if (inactiveProduct) {
      throw new BadRequestException(
        `Cannot receive inactive product "${inactiveProduct.name}" (${inactiveProduct.sku}).`,
      );
    }

    // Verify locations belong to tenant AND to the selected warehouse
    const locations = await this.prisma.location.findMany({
      where: {
        id: { in: locationIds },
        tenantId,
        warehouseId,
      },
    });

    if (locations.length !== locationIds.length) {
      throw new BadRequestException(
        'One or more destination locations do not belong to the selected warehouse or are invalid.',
      );
    }

    const inactiveLocation = locations.find((l) => l.status === 'INACTIVE');
    if (inactiveLocation) {
      throw new BadRequestException(
        `Cannot receive into inactive location "${inactiveLocation.name}" (${inactiveLocation.shortCode}).`,
      );
    }
  }
}
