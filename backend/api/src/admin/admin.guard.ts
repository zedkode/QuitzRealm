import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const role = request.user?.role;
    if (role !== 'ADMIN' && role !== 'MODERATOR' && role !== 'CONTENT_EDITOR' && role !== 'SUPPORT') {
      throw new ForbiddenException('Admin clearance required.');
    }
    return true;
  }
}
