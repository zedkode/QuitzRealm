import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { LocalizedContentService } from '../localization/localized-content.service';
import { DEFAULT_LOCALE } from '../localization/localization.types';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from './dto/password-reset.dto';

type LocalizedRequest = Request & { locale?: string };

const AUTH_PAGE_KEYS = {
  verifyMissingTitle: 'auth.page.verify.missing.title',
  verifyMissingMessage: 'auth.page.verify.missing.message',
  verifyInvalidTitle: 'auth.page.verify.invalid.title',
  verifyInvalidMessage: 'auth.page.verify.invalid.message',
  verifySuccessTitle: 'auth.page.verify.success.title',
  verifySuccessMessage: 'auth.page.verify.success.message',
  resetMissingTitle: 'auth.page.reset.missing.title',
  resetMissingMessage: 'auth.page.reset.missing.message',
  resetFormTitle: 'auth.page.reset.form.title',
  resetFormMessage: 'auth.page.reset.form.message',
  resetFormLabel: 'auth.page.reset.form.label',
  resetFormSubmit: 'auth.page.reset.form.submit',
  resetInvalidTitle: 'auth.page.reset.invalid.title',
  resetInvalidMessage: 'auth.page.reset.invalid.message',
  resetSuccessTitle: 'auth.page.reset.success.title',
  resetSuccessMessage: 'auth.page.reset.success.message',
} as const;

const AUTH_PAGE_KEY_LIST = Object.values(AUTH_PAGE_KEYS);

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
  constructor(
    private readonly auth: AuthService,
    private readonly localizedContent: LocalizedContentService,
  ) {}

  @Get('verify-email')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async verifyEmailPage(
    @Req() request: LocalizedRequest,
    @Query('token') token?: string,
  ): Promise<string> {
    const locale = request.locale ?? DEFAULT_LOCALE;
    const copy = await this.copy(locale);
    if (!token) {
      return page(
        locale,
        copy[AUTH_PAGE_KEYS.verifyMissingTitle],
        copy[AUTH_PAGE_KEYS.verifyMissingMessage],
      );
    }
    try {
      await this.auth.confirmEmailVerification(token);
    } catch {
      return page(
        locale,
        copy[AUTH_PAGE_KEYS.verifyInvalidTitle],
        copy[AUTH_PAGE_KEYS.verifyInvalidMessage],
      );
    }
    return page(
      locale,
      copy[AUTH_PAGE_KEYS.verifySuccessTitle],
      copy[AUTH_PAGE_KEYS.verifySuccessMessage],
    );
  }

  @Get('reset-password')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async resetPasswordPage(
    @Req() request: LocalizedRequest,
    @Query('token') token?: string,
  ): Promise<string> {
    const locale = request.locale ?? DEFAULT_LOCALE;
    const copy = await this.copy(locale);
    if (!token) {
      return page(
        locale,
        copy[AUTH_PAGE_KEYS.resetMissingTitle],
        copy[AUTH_PAGE_KEYS.resetMissingMessage],
      );
    }
    return page(
      locale,
      copy[AUTH_PAGE_KEYS.resetFormTitle],
      copy[AUTH_PAGE_KEYS.resetFormMessage],
      `<form method="post" action="reset-password">
        <input type="hidden" name="token" value="${escapeHtml(token)}" />
        <label for="password">${escapeHtml(copy[AUTH_PAGE_KEYS.resetFormLabel])}</label>
        <input id="password" name="password" type="password"
               minlength="10" maxlength="128" required autocomplete="new-password" />
        <button type="submit">${escapeHtml(copy[AUTH_PAGE_KEYS.resetFormSubmit])}</button>
      </form>`,
    );
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Header('Content-Type', 'text/html; charset=utf-8')
  async submitResetPassword(
    @Req() request: LocalizedRequest,
    @Body() dto: ResetPasswordDto,
  ): Promise<string> {
    const locale = request.locale ?? DEFAULT_LOCALE;
    const copy = await this.copy(locale);
    try {
      await this.auth.resetPassword(dto.token, dto.password);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return page(
          locale,
          copy[AUTH_PAGE_KEYS.resetInvalidTitle],
          copy[AUTH_PAGE_KEYS.resetInvalidMessage],
        );
      }
      throw error;
    }
    return page(
      locale,
      copy[AUTH_PAGE_KEYS.resetSuccessTitle],
      copy[AUTH_PAGE_KEYS.resetSuccessMessage],
    );
  }

  private copy(locale: string): Promise<Readonly<Record<string, string>>> {
    return this.localizedContent.values(locale, AUTH_PAGE_KEY_LIST);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function page(
  locale: string,
  title: string,
  message: string,
  extra = '',
): string {
  return `<!doctype html>
<html lang="${escapeHtml(locale)}">
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
