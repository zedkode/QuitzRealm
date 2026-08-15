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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedUser, GoogleUser } from './auth.types';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfirmTokenDto } from './dto/verify-email.dto';
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

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() request: GoogleRequest) {
    return this.auth.loginWithGoogle(request.user, sessionContext(request));
  }
}
