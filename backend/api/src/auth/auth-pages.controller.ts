import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from './dto/password-reset.dto';

/// Paginile deschise direct din emailuri.
///
/// Linkul dintr-un email ajunge într-un browser, nu în aplicație: un `GET` care
/// întoarce JSON sau 404 arată ca o eroare, chiar dacă fluxul a mers. De aici,
/// două pagini HTML minimale servite de API — nu un frontend, doar capătul
/// vizibil al fluxurilor din §1.3 și §1.4.
///
/// Când va exista un website (§13), rutele astea se pot redirecta acolo fără a
/// schimba nimic în emailuri.
@Controller('auth')
export class AuthPagesController {
  constructor(private readonly auth: AuthService) {}

  @Get('verify-email')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async verifyEmailPage(@Query('token') token?: string): Promise<string> {
    if (!token) {
      return page(
        'Link incomplet',
        'Linkul de verificare nu conține un token.',
      );
    }
    try {
      await this.auth.confirmEmailVerification(token);
    } catch {
      return page(
        'Link invalid sau expirat',
        'Cere un link nou din aplicație, de la Setări → Cont.',
      );
    }
    return page(
      'Adresă confirmată',
      'Contul tău e verificat. Poți închide pagina și te poți întoarce în joc.',
    );
  }

  @Get('reset-password')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  resetPasswordPage(@Query('token') token?: string): string {
    if (!token) {
      return page('Link incomplet', 'Linkul de resetare nu conține un token.');
    }
    return page(
      'Alege o parolă nouă',
      'Parola trebuie să aibă cel puțin 10 caractere.',
      `<form method="post" action="reset-password">
        <input type="hidden" name="token" value="${escapeHtml(token)}" />
        <label for="password">Parolă nouă</label>
        <input id="password" name="password" type="password"
               minlength="10" maxlength="128" required autocomplete="new-password" />
        <button type="submit">Salvează parola</button>
      </form>`,
    );
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async submitResetPassword(@Body() dto: ResetPasswordDto): Promise<string> {
    try {
      await this.auth.resetPassword(dto.token, dto.password);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return page(
          'Link invalid sau expirat',
          'Cere o resetare nouă din ecranul de autentificare.',
        );
      }
      throw error;
    }
    return page(
      'Parolă schimbată',
      'Toate dispozitivele conectate au fost deconectate. ' +
        'Autentifică-te din nou în aplicație cu parola nouă.',
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function page(title: string, message: string, extra = ''): string {
  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>QuizRealm — ${escapeHtml(title)}</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center;
         background: #14100c; color: #f0e6d2; padding: 24px;
         font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 26rem; width: 100%; background: #1f1913;
         border: 1px solid #3d3226; border-radius: 14px; padding: 28px; }
  h1 { margin: 0 0 12px; font-size: 1.35rem; color: #e8c37a; }
  p { margin: 0; line-height: 1.55; color: #cfc2ab; }
  form { margin-top: 20px; display: grid; gap: 8px; }
  label { font-size: .85rem; color: #cfc2ab; }
  input { padding: 11px 12px; border-radius: 8px; border: 1px solid #3d3226;
          background: #14100c; color: #f0e6d2; font-size: 1rem; }
  button { margin-top: 8px; padding: 12px; border: 0; border-radius: 8px;
           background: #c9a227; color: #14100c; font-size: 1rem;
           font-weight: 600; cursor: pointer; }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(message)}</p>
  ${extra}
</main>
</body>
</html>`;
}
