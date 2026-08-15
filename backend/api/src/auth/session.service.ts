import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

/// Câte dispozitive poate ține un cont conectate simultan. Peste această
/// limită, cea mai veche sesiune cade — un cont cu zeci de sesiuni active e
/// fie abuz, fie tokenuri uitate pe dispozitive pierdute.
const MAX_ACTIVE_SESSIONS = 10;

export interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionSummary {
  id: string;
  deviceLabel: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  current: boolean;
}

/// Sesiunile sunt sursa de adevăr pentru „cine e conectat”. Refresh token-ul
/// trăiește într-un rând propriu, nu într-o coloană pe `users`, ca:
///   - un login nou să nu deconecteze celelalte dispozitive;
///   - fiecare dispozitiv să poată fi revocat separat;
///   - o acțiune administrativă (ban) să poată închide instant tot contul.
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly ipPepper: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    // IP-urile se păstrează doar ca HMAC: suficient ca să recunoaștem același
    // dispozitiv, inutil pentru cineva care ar citi tabela.
    this.ipPepper = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async create({
    userId,
    refreshToken,
    expiresAt,
    context,
  }: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    context: SessionContext;
  }): Promise<string> {
    const session = await this.prisma.userSession.create({
      data: {
        userId,
        refreshTokenHash: await argon2.hash(refreshToken),
        deviceLabel: this.deviceLabel(context.userAgent),
        ipHash: this.hashIp(context.ipAddress),
        expiresAt,
      },
      select: { id: true },
    });
    await this.trimOldestSessions(userId);
    return session.id;
  }

  async rotate({
    sessionId,
    refreshToken,
    expiresAt,
    context,
  }: {
    sessionId: string;
    refreshToken: string;
    expiresAt: Date;
    context: SessionContext;
  }): Promise<void> {
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: {
        refreshTokenHash: await argon2.hash(refreshToken),
        expiresAt,
        lastSeenAt: new Date(),
        deviceLabel: this.deviceLabel(context.userAgent),
        ipHash: this.hashIp(context.ipAddress),
      },
    });
  }

  /// Verifică token-ul primit împotriva sesiunii lui.
  ///
  /// Trei cazuri, tratate diferit:
  ///   - **sesiune revocată sau expirată** — token mort, atât. Dispozitivul pe
  ///     care tocmai l-ai deconectat va mai încerca o dată; asta nu e un atac
  ///     și nu are voie să te scoată de pe celelalte dispozitive.
  ///   - **sesiune activă, hash potrivit** — cazul normal.
  ///   - **sesiune activă, hash nepotrivit** — token-ul e semnat corect, deci a
  ///     fost emis cândva pentru sesiunea asta, dar între timp a fost rotit de
  ///     altcineva. Adică două părți dețin tokenuri ale aceleiași sesiuni: una
  ///     dintre ele l-a furat. Nu putem ști care, deci închidem tot contul.
  async verify(
    sessionId: string,
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) return false;
    if (session.revokedAt !== null) return false;
    if (session.expiresAt.getTime() <= Date.now()) return false;

    if (await argon2.verify(session.refreshTokenHash, refreshToken)) {
      return true;
    }

    this.logger.warn(
      `Refresh token deja rotit, rejucat pe sesiunea activă ${sessionId}; ` +
        `închid toate sesiunile contului ${userId}.`,
    );
    await this.revokeAll(userId);
    return false;
  }

  async list(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionSummary[]> {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true,
        deviceLabel: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    });
    return sessions.map((session) => ({
      ...session,
      current: session.id === currentSessionId,
    }));
  }

  /// Revocă o sesiune anume. Întoarce `false` dacă sesiunea nu e a acestui
  /// utilizator — un cont nu poate închide sesiunile altuia.
  async revoke(userId: string, sessionId: string): Promise<boolean> {
    const result = await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }

  async revokeAll(userId: string, exceptSessionId?: string): Promise<number> {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  /// Peste plafon, cad cele mai vechi văzute. Le luăm după `lastSeenAt`, nu
  /// după `createdAt`: contează ce dispozitiv chiar se folosește.
  private async trimOldestSessions(userId: string): Promise<void> {
    const active = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
      select: { id: true },
    });
    if (active.length <= MAX_ACTIVE_SESSIONS) return;

    const excess = active.slice(MAX_ACTIVE_SESSIONS).map((row) => row.id);
    await this.prisma.userSession.updateMany({
      where: { id: { in: excess } },
      data: { revokedAt: new Date() },
    });
  }

  /// Etichetă lizibilă din User-Agent. Nu încercăm parsare exactă: e doar un
  /// indiciu pentru utilizator („de pe ce dispozitiv e sesiunea asta”).
  private deviceLabel(userAgent?: string): string | null {
    const raw = userAgent?.trim();
    if (!raw) return null;
    return raw.slice(0, 120);
  }

  private hashIp(ipAddress?: string): string | null {
    if (!ipAddress) return null;
    return createHmac('sha256', this.ipPepper)
      .update(ipAddress)
      .digest('hex')
      .slice(0, 64);
  }
}
