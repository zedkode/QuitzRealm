import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';

/// Câmpuri care nu au voie să ajungă în jurnal nici din greșeală.
const REDACTED_KEYS = new Set([
  'password',
  'newPassword',
  'currentPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'twoFactorSecret',
  'code',
  'apiKey',
  'providerPriceId',
]);

export interface AuditEntry {
  action: string;
  targetType?: string;
  targetId?: string;
  targetUserId?: string;
  payload?: unknown;
  success?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /// Scrie urma unei acțiuni de administrare.
  ///
  /// Nu aruncă niciodată: o defecțiune a jurnalului nu are voie să anuleze o
  /// acțiune deja executată, altfel un audit stricat ar bloca moderarea. Eșecul
  /// se raportează în loguri, unde e vizibil.
  async record(
    actor: AuthenticatedUser,
    request: Request | undefined,
    entry: AuditEntry,
  ): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: entry.action,
          targetType: entry.targetType ?? null,
          targetId: entry.targetId ?? null,
          targetUserId: entry.targetUserId ?? null,
          payload: (redact(entry.payload) ?? null) as never,
          ip: clientIp(request),
          userAgent: request?.headers['user-agent']?.slice(0, 300) ?? null,
          success: entry.success ?? true,
        },
      });
    } catch (error) {
      this.logger.error(
        `Nu s-a putut scrie auditul pentru ${entry.action}: ${String(error)}`,
      );
    }
  }
}

/// Adresa clientului. `x-forwarded-for` e primul pentru că API-ul stă în
/// spatele Cloudflare Tunnel, deci `remoteAddress` e mereu al tunelului.
function clientIp(request: Request | undefined): string | null {
  if (!request) return null;
  const forwarded = request.headers['x-forwarded-for'];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const ip = value?.split(',')[0]?.trim() || request.socket?.remoteAddress || null;
  return ip ? ip.slice(0, 64) : null;
}

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value !== 'object') return value;

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACTED_KEYS.has(key) ? '[redactat]' : redact(entry);
  }
  return result;
}
