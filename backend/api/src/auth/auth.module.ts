import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalizationModule } from '../localization/localization.module';
import { AuthController } from './auth.controller';
import { CaptchaService } from './captcha.service';
import { AuthPagesController } from './auth-pages.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';
import { GoogleMobileAuthGuard } from './guards/google-mobile-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), LocalizationModule],
  controllers: [AuthController, AuthPagesController],
  providers: [
    AuthService,
    CaptchaService,
    AuthTokenService,
    SessionService,
    TotpService,
    GoogleMobileAuthGuard,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
