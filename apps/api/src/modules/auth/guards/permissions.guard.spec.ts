import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('PermissionsGuard (Phase 02 RBAC Authorization)', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  function createMockContext(request: any): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user role is SUPER_ADMIN even if specific permission is not explicitly listed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['product:delete', 'tenant:manage']);

    const context = createMockContext({
      user: { role: 'SUPER_ADMIN' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['product:view', 'product:create']);

    const context = createMockContext({
      user: { role: 'INVENTORY_MANAGER' },
      membership: {
        permissions: ['product:view', 'product:create', 'product:update'],
      },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should REJECT with ForbiddenException when user is missing any required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['warehouse:manage']);

    const context = createMockContext({
      user: { role: 'VIEWER' },
      membership: {
        permissions: ['product:view', 'warehouse:view'], // missing warehouse:manage
      },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Missing required permission(s): warehouse:manage',
    );
  });
});
