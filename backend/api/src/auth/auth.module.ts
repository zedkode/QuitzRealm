import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthPagesController } from './auth-pages.controller';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';
import { SessionService } from './session.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController, AuthPagesController],
  providers: [
    AuthService,
    AuthTokenService,
    SessionService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
