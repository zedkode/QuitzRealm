import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/// Permite propagarea nonce-ului generat local de aplicație prin Google OAuth.
/// Callback-ul mobil îl întoarce aplicației, care îl compară cu valoarea păstrată
/// local; astfel un link OAuth trimis de un atacator nu poate conecta aplicația
/// victimei la contul atacatorului.
@Injectable()
export class GoogleMobileAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const state = request.query.state;
    if (
      typeof state !== 'string' ||
      !/^mobile\.[A-Za-z0-9_-]{24,128}$/.test(state)
    ) {
      throw new UnauthorizedException('Lipsește nonce-ul de autentificare mobilă.');
    }
    return { state };
  }
}
