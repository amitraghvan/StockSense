import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { FastifyRequest } from 'fastify';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permission metadata is set, access is permitted
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<
      FastifyRequest & {
        user?: any;
        membership?: { permissions?: string[]; roleName?: string };
      }
    >();

    // Check permissions from tenant membership if present, or user token permissions
    const userRole = request.membership?.roleName || request.user?.role;
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    const userPermissions: string[] =
      request.membership?.permissions || request.user?.permissions || [];

    const hasAllRequired = requiredPermissions.every((perm) => userPermissions.includes(perm));

    if (!hasAllRequired) {
      const missing = requiredPermissions.filter((p) => !userPermissions.includes(p));
      throw new ForbiddenException(
        `Insufficient permissions. Missing required permission(s): ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
