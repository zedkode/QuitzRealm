import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '@prisma/client';

export const ADMIN_ROLES_KEY = 'adminRoles';

/// Restrânge o rută la anumite roluri.
///
/// Fără decorator, `AdminGuard` acceptă orice rol de personal — potrivit pentru
/// citiri. Orice operație care schimbă bani, prețuri sau roluri trebuie să
/// declare explicit `@AdminRoles('ADMIN')`: altfel un moderator adus pentru
/// chat ar putea edita magazinul.
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);

/// Rolurile care au voie în zona de administrare, indiferent de rută.
export const STAFF_ROLES: AdminRole[] = ['ADMIN', 'MODERATOR', 'CONTENT_EDITOR', 'SUPPORT'];
