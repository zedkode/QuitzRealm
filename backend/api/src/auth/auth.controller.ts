import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedUser, GoogleUser } from './auth.types';
import {
  ChangePasswordDto,
  DeleteAccountDto,
} from './dto/change-password.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';
import { GoogleMobileExchangeDto } from './dto/google-mobile-exchange.dto';
import { MigrateGuestProgressDto } from './dto/guest-migration.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfirmTokenDto } from './dto/verify-email.dto';
import {
  CompleteTwoFactorLoginDto,
  DisableTwoFactorDto,
  EnableTwoFactorDto,
} from './dto/two-factor.dto';
import { GoogleMobileAuthGuard } from './guards/google-mobile-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SessionContext, SessionService } from './session.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };
type GoogleRequest = Request & { user: GoogleUser };

/// Contextul dispozitivului, pentru lista de sesiuni active. E derivat din
/// cerere, nu din body: clientul nu-și poate declara singur identitatea.
function sessionContext(request: Request): SessionContext {
  return {
    userAgent: request.header('user-agent') ?? undefined,
    ipAddress: request.ip,
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  register(@Body() dto: RegisterDto, @Req() request: Request) {
    return this.auth.register(dto, sessionContext(request));
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.auth.login(dto, sessionContext(request));
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request) {
    return this.auth.refresh(dto.refreshToken, sessionContext(request));
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.auth.logout(request.user.id, request.user.sessionId);
  }

  // --- Autentificare cu doi factori (TOTP, §1.1) ---

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/setup')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  startTwoFactorEnrollment(
    @Req() request: AuthenticatedRequest,
    @Body() dto: EnableTwoFactorDto,
  ) {
    return this.auth.startTwoFactorEnrollment(
      request.user.id,
      dto.currentPassword,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/confirm')
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  confirmTwoFactorEnrollment(
    @Req() request: AuthenticatedRequest,
    @Body() dto: EnableTwoFactorDto,
  ) {
    return this.auth.confirmTwoFactorEnrollment(
      request.user.id,
      dto.currentPassword,
      dto.code,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('two-factor/disable')
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @HttpCode(204)
  async disableTwoFactor(
    @Req() request: AuthenticatedRequest,
    @Body() dto: DisableTwoFactorDto,
  ): Promise<void> {
    await this.auth.disableTwoFactor(
      request.user.id,
      dto.currentPassword,
      dto.code,
    );
  }

  @Post('two-factor/login')
  @Throttle({ default: { limit: 10, ttl: 5 * 60_000 } })
  completeTwoFactorLogin(
    @Body() dto: CompleteTwoFactorLoginDto,
    @Req() request: Request,
  ) {
    return this.auth.completeTwoFactorLogin(
      dto.challengeToken,
      dto.code,
      sessionContext(request),
    );
  }

  // --- Sesiuni active (§1.5) ---

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  listSessions(@Req() request: AuthenticatedRequest) {
    return this.sessions.list(request.user.id, request.user.sessionId);
  }

  /// Închide un alt dispozitiv. Filtrul pe `userId` din serviciu face ca un
  /// cont să nu poată revoca sesiunile altuia.
  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(204)
  async revokeSession(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.sessions.revoke(request.user.id, id);
  }

  /// „Deconectează-mă de peste tot, mai puțin de aici.”
  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  async revokeOtherSessions(@Req() request: AuthenticatedRequest) {
    const revoked = await this.sessions.revokeAll(
      request.user.id,
      request.user.sessionId,
    );
    return { revoked };
  }

  // --- Conversie mod invitat (§1.1) ---

  @UseGuards(JwtAuthGuard)
  @Post('guest/migrate')
  @Throttle({ default: { limit: 3, ttl: 60 * 60_000 } })
  @HttpCode(204)
  async migrateGuestProgress(
    @Req() request: AuthenticatedRequest,
    @Body() dto: MigrateGuestProgressDto,
  ): Promise<void> {
    await this.auth.migrateGuestProgress(request.user.id, dto);
  }

  // --- Verificare email (§1.3) ---

  @UseGuards(JwtAuthGuard)
  @Post('verify-email/request')
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @HttpCode(202)
  async requestEmailVerification(
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.auth.requestEmailVerification(request.user.id);
  }

  @Post('verify-email/confirm')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @HttpCode(204)
  async confirmEmailVerification(@Body() dto: ConfirmTokenDto): Promise<void> {
    await this.auth.confirmEmailVerification(dto.token);
  }

  // --- Schimbare parolă din cont & ștergere cont ---

  /// Limitat strict: fără plafon, endpointul ar fi un oracol care spune dacă
  /// parola ghicită e cea corectă, pe o sesiune deja obținută.
  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @HttpCode(204)
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.auth.changePassword(
      request.user.id,
      dto.currentPassword,
      dto.newPassword,
      request.user.sessionId,
    );
  }

  /// Ștergerea contului e definitivă și nu are pas de anulare pe server:
  /// confirmarea se cere în aplicație, iar aici se execută.
  @UseGuards(JwtAuthGuard)
  @Post('account/delete')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @HttpCode(204)
  async deleteAccount(
    @Req() request: AuthenticatedRequest,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    await this.auth.deleteAccount(request.user.id, dto.password);
  }

  // --- Resetare parolă (§1.4) ---

  /// Răspunde 202 indiferent dacă adresa există: altfel endpointul ar spune
  /// oricui ce conturi sunt înregistrate.
  @Post('password-reset/request')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @HttpCode(202)
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<void> {
    await this.auth.requestPasswordReset(dto.email);
  }

  @Post('password-reset/confirm')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @HttpCode(204)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(): void {}

  /// Inițiere pentru aplicația mobilă. Nonce-ul este generat și verificat de
  /// client; serverul îl propagă prin Google OAuth și redirecționează doar spre
  /// schema fixă `quizrealm://`, nu spre un URL furnizat de cerere.
  @Get('google/mobile')
  @UseGuards(GoogleMobileAuthGuard)
  googleMobileLogin(): void {}

  @Post('google/mobile/exchange')
  @Throttle({ default: { limit: 10, ttl: 5 * 60_000 } })
  exchangeGoogleMobile(
    @Body() dto: GoogleMobileExchangeDto,
    @Req() request: Request,
  ) {
    return this.auth.exchangeGoogleMobileCode(dto.code, sessionContext(request));
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() request: GoogleRequest,
    @Res() response: Response,
  ): Promise<void> {
    const state = request.query.state;
    if (
      typeof state === 'string' &&
      /^mobile\.[A-Za-z0-9_-]{24,128}$/.test(state)
    ) {
      const code = await this.auth.createGoogleMobileExchange(request.user);
      const callback = new URL('quizrealm://auth/google');
      callback.searchParams.set('state', state);
      callback.searchParams.set('code', code);
      response.redirect(302, callback.toString());
      return;
    }

    // Păstrăm endpointul JSON pentru clienții web/integrațiile existente.
    response.json(
      await this.auth.loginWithGoogle(request.user, sessionContext(request)),
    );
  }
}
