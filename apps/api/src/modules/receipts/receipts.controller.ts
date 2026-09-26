import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReceiptsService } from './receipts.service';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAccessPayload } from '@stocksense/types';
import { ReceiptStatus } from '@prisma/client';

@ApiTags('Receipts')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  @RequirePermissions('receipt:view')
  @ApiOperation({ summary: 'List inbound receipts with pagination, filtering, and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ReceiptStatus })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'scheduleDate', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentTenant() tenant: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: ReceiptStatus,
    @Query('warehouseId') warehouseId?: string,
    @Query('scheduleDate') scheduleDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.receiptsService.findAll(tenant.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      search,
      status,
      warehouseId,
      scheduleDate,
      sortBy: sortBy || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
  }

  @Get(':id')
  @RequirePermissions('receipt:view')
  @ApiOperation({ summary: 'Get receipt by ID with line items and relationships' })
  async findOne(@CurrentTenant() tenant: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.receiptsService.findOne(tenant.id, id);
  }

  @Post()
  @RequirePermissions('receipt:create')
  @ApiOperation({ summary: 'Create a new inbound receipt in DRAFT status' })
  async create(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.receiptsService.create(tenant.id, body, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('receipt:create')
  @ApiOperation({ summary: 'Update a DRAFT inbound receipt' })
  async update(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.receiptsService.update(tenant.id, id, body, user.sub);
  }

  @Post(':id/validate')
  @RequirePermissions('receipt:validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate receipt (DRAFT -> READY). Does NOT change stock.' })
  async validate(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.receiptsService.validateReceipt(tenant.id, id, user.sub);
  }

  @Post(':id/complete')
  @RequirePermissions('receipt:validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete receipt (READY -> DONE). Atomically increases stock.' })
  async complete(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.receiptsService.completeReceipt(tenant.id, id, user.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions('receipt:validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel receipt (DRAFT or READY -> CANCELLED)' })
  async cancel(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
  ) {
    return this.receiptsService.cancelReceipt(tenant.id, id, user.sub, body?.reason);
  }
}
