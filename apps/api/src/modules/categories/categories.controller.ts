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
import { CategoriesService } from './categories.service';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { JwtAccessPayload } from '@stocksense/types';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(TenantGuard, PermissionsGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('product:view')
  @ApiOperation({ summary: 'List categories' })
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
    return this.categoriesService.findAll(tenant.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
      search,
      status: status as 'ACTIVE' | 'INACTIVE' | undefined,
      sortBy: sortBy || 'createdAt',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    });
  }

  @Get(':id')
  @RequirePermissions('product:view')
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@CurrentTenant() tenant: { id: string }, @Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(tenant.id, id);
  }

  @Post()
  @RequirePermissions('product:create')
  @ApiOperation({ summary: 'Create category' })
  async create(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Body() body: { name: string; description?: string | null },
  ) {
    return this.categoriesService.create(tenant.id, body, user.sub);
  }

  @Patch(':id')
  @RequirePermissions('product:update')
  @ApiOperation({ summary: 'Update category' })
  async update(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: { name?: string; description?: string | null; status?: 'ACTIVE' | 'INACTIVE' },
  ) {
    return this.categoriesService.update(tenant.id, id, body, user.sub);
  }
}
