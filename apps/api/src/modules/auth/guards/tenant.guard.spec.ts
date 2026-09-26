import { TenantGuard } from './tenant.guard';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('TenantGuard (Phase 02 Isolation Security)', () => {
  let guard: TenantGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      membership: {
        findUnique: jest.fn(),
      },
    };
    guard = new TenantGuard(mockPrisma as unknown as PrismaService);
  });

  function createMockContext(user: any, headers: Record<string, string> = {}): ExecutionContext {
    const request: any = {
      user,
      headers,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access and attach tenant/membership when user has ACTIVE membership', async () => {
    const user = { sub: 'user-1', tenantId: 'tenant-alpha' };
    const context = createMockContext(user, { 'x-tenant-id': 'tenant-alpha' });

    mockPrisma.membership.findUnique.mockResolvedValue({
      id: 'member-1',
      userId: 'user-1',
      tenantId: 'tenant-alpha',
      roleId: 'role-admin',
      status: 'ACTIVE',
      tenant: {
        id: 'tenant-alpha',
        name: 'Alpha Corp',
        slug: 'alpha-corp',
        status: 'ACTIVE',
        createdAt: new Date(),
      },
      role: {
        id: 'role-admin',
        name: 'ADMIN',
        rolePermissions: [{ permission: { key: 'product:view' } }],
      },
    });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);

    const request = context.switchToHttp().getRequest<any>();
    expect(request.tenant).toBeDefined();
    expect(request.tenant.id).toBe('tenant-alpha');
    expect(request.membership.roleName).toBe('ADMIN');
  });

  it('should REJECT with ForbiddenException when User attempts cross-tenant access to Tenant Beta without membership', async () => {
    const user = { sub: 'user-1', tenantId: 'tenant-alpha' };
    // Attacker attempts to forge X-Tenant-Id header to access Tenant Beta
    const context = createMockContext(user, { 'x-tenant-id': 'tenant-beta-unauthorized' });

    mockPrisma.membership.findUnique.mockResolvedValue(null); // No membership in Tenant Beta

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Access denied: You are not an active member of this workspace.',
    );
  });

  it('should REJECT when workspace is suspended', async () => {
    const user = { sub: 'user-1', tenantId: 'tenant-suspended' };
    const context = createMockContext(user, { 'x-tenant-id': 'tenant-suspended' });

    mockPrisma.membership.findUnique.mockResolvedValue({
      id: 'member-2',
      status: 'ACTIVE',
      tenant: {
        id: 'tenant-suspended',
        status: 'SUSPENDED',
      },
      role: {
        name: 'VIEWER',
        rolePermissions: [],
      },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Access denied: This workspace has been suspended.',
    );
  });
});
