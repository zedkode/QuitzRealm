import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import { Socket } from 'socket.io';

export interface RealtimeJwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class RealtimeAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async authenticate(socket: Socket): Promise<RealtimeJwtPayload> {
    const handshakeToken = socket.handshake.auth?.token as unknown;
    const authorization = socket.handshake.headers.authorization;
    const rawToken =
      typeof handshakeToken === 'string'
        ? handshakeToken
        : typeof authorization === 'string'
          ? authorization.replace(/^Bearer\s+/i, '')
          : '';
    if (!rawToken) {
      throw new UnauthorizedException('Token JWT lipsă.');
    }

    try {
      const payload = await this.jwt.verifyAsync<RealtimeJwtPayload>(rawToken, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (!isUUID(payload.sub) || typeof payload.email !== 'string') {
        throw new Error('Payload invalid.');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Token JWT invalid sau expirat.');
    }
  }
}
