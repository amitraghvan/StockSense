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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAccessPayload } from '@stocksense/types';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @RequirePermissions('warehouse:view')
  @ApiOperation({ summary: 'List warehouses' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async findAll(
    @CurrentTenant() tenant: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.warehousesService.findAll(tenant.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      search,
      status: status as 'ACTIVE' | 'INACTIVE' | undefined,
      sortBy: sortBy || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
  }

  @Get(':id')
  @RequirePermissions('warehouse:view')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async findOne(@CurrentTenant() tenant: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.warehousesService.findOne(tenant.id, id);
  }

  @Post()
  @RequirePermissions('warehouse:manage')
  @ApiOperation({ summary: 'Create warehouse' })
  async create(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.warehousesService.create(tenant.id, body, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('warehouse:manage')
  @ApiOperation({ summary: 'Update warehouse' })
  async update(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.warehousesService.update(tenant.id, id, body, user.sub);
  }

  // ── Location endpoints nested under warehouse ──
  @Get(':id/locations')
  @RequirePermissions('warehouse:view')
  @ApiOperation({ summary: 'List locations in a warehouse' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getLocations(
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) warehouseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.warehousesService.getLocations(tenant.id, warehouseId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      search,
      status: status as 'ACTIVE' | 'INACTIVE' | undefined,
    });
  }
}
