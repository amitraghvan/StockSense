import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { FastifyRequest } from 'fastify';
import { JwtAccessPayload } from '@stocksense/types';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      FastifyRequest & {
        user?: JwtAccessPayload;
        tenant?: any;
        membership?: any;
      }
    >();

    const user = request.user;
    if (!user || !user.sub) {
      throw new ForbiddenException('User context missing for tenant evaluation.');
    }

    // Determine target tenant ID from header or authenticated token payload
    const headerTenantId = request.headers['x-tenant-id'] as string | undefined;
    const targetTenantId = headerTenantId || user.tenantId;

    if (!targetTenantId) {
      throw new ForbiddenException(
        'Tenant context could not be determined. Please specify a tenant workspace.',
      );
    }

    // Verify user belongs to tenant with ACTIVE status
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: user.sub,
          tenantId: targetTenantId,
        },
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

    if (!membership || membership.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Access denied: You are not an active member of this workspace.',
      );
    }

    if (membership.tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('Access denied: This workspace has been suspended.');
    }

    // Attach verified tenant and membership to request
    request.tenant = {
      id: membership.tenant.id,
      name: membership.tenant.name,
      slug: membership.tenant.slug,
      status: membership.tenant.status,
      createdAt: membership.tenant.createdAt.toISOString(),
    };

    request.membership = {
      id: membership.id,
      roleId: membership.roleId,
      roleName: membership.role.name,
      permissions: membership.role.rolePermissions.map((rp) => rp.permission.key),
    };

    return true;
  }
}
