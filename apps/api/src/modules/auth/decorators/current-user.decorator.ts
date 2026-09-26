import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAccessPayload } from '@stocksense/types';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtAccessPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtAccessPayload;

    return data ? user?.[data] : user;
  },
);
