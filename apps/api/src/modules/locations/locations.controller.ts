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
import { LocationsService } from './locations.service';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAccessPayload } from '@stocksense/types';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequirePermissions('warehouse:view')
  @ApiOperation({ summary: 'List all locations across warehouses' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async findAll(
    @CurrentTenant() tenant: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.locationsService.findAll(tenant.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      search,
      status: status as 'ACTIVE' | 'INACTIVE' | undefined,
      warehouseId,
      sortBy: sortBy || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
  }

  @Get(':id')
  @RequirePermissions('warehouse:view')
  @ApiOperation({ summary: 'Get location by ID' })
  async findOne(@CurrentTenant() tenant: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOne(tenant.id, id);
  }

  @Post()
  @RequirePermissions('warehouse:manage')
  @ApiOperation({ summary: 'Create location' })
  async create(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.locationsService.create(tenant.id, body, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('warehouse:manage')
  @ApiOperation({ summary: 'Update location' })
  async update(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.locationsService.update(tenant.id, id, body, user.sub);
  }
}
