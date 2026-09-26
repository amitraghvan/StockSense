import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAccessPayload } from '@stocksense/types';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('product:view')
  @ApiOperation({ summary: 'List products' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'unitOfMeasure', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async findAll(
    @CurrentTenant() tenant: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('unitOfMeasure') unitOfMeasure?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.productsService.findAll(tenant.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      search,
      status: status as 'ACTIVE' | 'INACTIVE' | undefined,
      categoryId,
      unitOfMeasure,
      sortBy: sortBy || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
  }

  @Get(':id')
  @RequirePermissions('product:view')
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@CurrentTenant() tenant: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(tenant.id, id);
  }

  @Post()
  @RequirePermissions('product:create')
  @ApiOperation({ summary: 'Create product' })
  async create(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.productsService.create(tenant.id, body, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('product:update')
  @ApiOperation({ summary: 'Update product' })
  async update(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.productsService.update(tenant.id, id, body, user.sub);
  }

  @Delete(':id')
  @RequirePermissions('product:delete')
  @ApiOperation({ summary: 'Deactivate product (soft delete)' })
  async deactivate(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.productsService.update(tenant.id, id, { status: 'INACTIVE' }, user.sub);
  }
}
