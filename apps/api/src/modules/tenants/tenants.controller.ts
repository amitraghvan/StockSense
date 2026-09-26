import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SystemPermissions } from '@stocksense/validation';
import { JwtAccessPayload, TenantSummary } from '@stocksense/types';

@ApiTags('Tenants & Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all workspaces/tenants the authenticated user belongs to' })
  @ApiResponse({ status: 200, description: 'List of user workspaces' })
  async getUserTenants(@CurrentUser() user: JwtAccessPayload) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId: user.sub,
        status: 'ACTIVE',
      },
      include: {
        tenant: true,
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      tenant: {
        id: m.tenant.id,
        name: m.tenant.name,
        slug: m.tenant.slug,
        status: m.tenant.status,
        createdAt: m.tenant.createdAt.toISOString(),
      },
      role: {
        id: m.role.id,
        name: m.role.name,
        description: m.role.description,
        isSystem: m.role.isSystem,
        permissions: m.role.rolePermissions.map((rp) => rp.permission.key),
      },
      status: m.status,
    }));
  }

  @Get('active-workspace')
  @UseGuards(TenantGuard)
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target workspace UUID' })
  @ApiOperation({
    summary: 'Inspect current tenant context (verified server-side via TenantGuard)',
  })
  @ApiResponse({ status: 200, description: 'Verified tenant workspace details' })
  @ApiResponse({ status: 403, description: 'Cross-tenant access forbidden' })
  async getActiveWorkspace(
    @CurrentUser() user: JwtAccessPayload,
    @CurrentTenant() tenant: TenantSummary,
  ) {
    return {
      message: 'Tenant context successfully verified by server-side security boundary.',
      userId: user.sub,
      tenant,
    };
  }

  @Get('administrative-settings')
  @UseGuards(TenantGuard, PermissionsGuard)
  @RequirePermissions(SystemPermissions.TENANT_MANAGE)
  @ApiHeader({ name: 'x-tenant-id', required: false, description: 'Target workspace UUID' })
  @ApiOperation({
    summary: 'Protected workspace management endpoint requiring TENANT_MANAGE permission',
  })
  @ApiResponse({ status: 200, description: 'Tenant settings returned' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getAdministrativeSettings(@CurrentTenant() tenant: TenantSummary) {
    return {
      message: 'Authorized access to tenant administration settings.',
      tenantId: tenant.id,
      tenantName: tenant.name,
      settings: {
        isolationMode: 'STRICT_ROW_LEVEL_AND_TENANT_GUARD',
        cachePrefix: `tenant:${tenant.id}:*`,
      },
    };
  }
}
