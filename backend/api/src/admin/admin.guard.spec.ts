import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

function contextWithRole(role?: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it.each(['ADMIN', 'MODERATOR', 'CONTENT_EDITOR', 'SUPPORT'])('allows %s', (role) => {
    expect(guard.canActivate(contextWithRole(role))).toBe(true);
  });

  it.each(['USER', undefined])('rejects %s', (role) => {
    expect(() => guard.canActivate(contextWithRole(role))).toThrow(ForbiddenException);
  });
});
