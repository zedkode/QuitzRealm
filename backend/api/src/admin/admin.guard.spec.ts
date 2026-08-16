import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from '@prisma/client';
import { AdminGuard } from './admin.guard';

function contextFor(user?: { role?: string; bannedAt?: Date | null }): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

/// Reflector care răspunde cu aceleași roluri cerute pentru orice rută.
function reflectorRequiring(roles?: AdminRole[]): Reflector {
  return { getAllAndOverride: () => roles } as unknown as Reflector;
}

describe('AdminGuard', () => {
  describe('fără restricție pe rută', () => {
    const guard = new AdminGuard(reflectorRequiring(undefined));

    it.each(['ADMIN', 'MODERATOR', 'CONTENT_EDITOR', 'SUPPORT'])('acceptă %s', (role) => {
      expect(guard.canActivate(contextFor({ role }))).toBe(true);
    });

    it.each(['USER', undefined])('refuză %s', (role) => {
      expect(() => guard.canActivate(contextFor(role ? { role } : undefined))).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('rută rezervată administratorilor', () => {
    const guard = new AdminGuard(reflectorRequiring(['ADMIN']));

    it('acceptă ADMIN', () => {
      expect(guard.canActivate(contextFor({ role: 'ADMIN' }))).toBe(true);
    });

    // Cazul care contează: un moderator adus pentru chat nu are voie să umble
    // la magazin sau la plăți doar pentru că face parte din personal.
    it.each(['MODERATOR', 'CONTENT_EDITOR', 'SUPPORT'])('refuză %s', (role) => {
      expect(() => guard.canActivate(contextFor({ role }))).toThrow(ForbiddenException);
    });
  });

  it('refuză un cont de personal suspendat', () => {
    const guard = new AdminGuard(reflectorRequiring(undefined));
    expect(() =>
      guard.canActivate(contextFor({ role: 'ADMIN', bannedAt: new Date() })),
    ).toThrow(ForbiddenException);
  });
});
