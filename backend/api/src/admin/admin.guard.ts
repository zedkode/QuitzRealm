import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AdminRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ADMIN_ROLES_KEY, STAFF_ROLES } from './admin-roles.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const role = request.user?.role;

    if (role === undefined || !STAFF_ROLES.includes(role)) {
      throw new ForbiddenException('Admin clearance required.');
    }

    // Ruta poate cere mai mult decât apartenența la personal. Se citește și de
    // pe metodă, și de pe controller, ca o restricție pusă pe tot controllerul
    // să nu poată fi pierdută adăugând o metodă nouă.
    const required = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (required !== undefined && required.length > 0 && !required.includes(role)) {
      throw new ForbiddenException('Insufficient admin role for this action.');
    }

    // Un cont de personal suspendat nu are voie să acționeze nici dacă tokenul
    // lui e încă valid: banul are efect imediat, nu la expirarea sesiunii.
    if (request.user?.bannedAt != null) {
      throw new ForbiddenException('Account suspended.');
    }

    return true;
  }
}
