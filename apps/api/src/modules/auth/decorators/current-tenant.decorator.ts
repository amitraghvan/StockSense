import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantSummary } from '@stocksense/types';

export const CurrentTenant = createParamDecorator(
  (data: keyof TenantSummary | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tenant = request.tenant as TenantSummary;

    return data ? tenant?.[data] : tenant;
  },
);
