import {
  BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminGuard } from './admin.guard';
import { AdminRoles } from './admin-roles.decorator';
import { AuditService } from './audit.service';
import { PlayersService, type PlayerListQuery } from './players.service';

/// Câte conturi poate atinge o singură acțiune în masă.
///
/// Limita nu e o optimizare: o operație de disciplină aplicată din greșeală
/// peste zeci de mii de conturi nu se poate anula, iar o cerere care ar trebui
/// să atingă mai mult de atât e aproape sigur o greșeală de selecție.
const BULK_LIMIT = 100;

const BULK_ACTIONS = ['suspend', 'unsuspend', 'revoke-sessions', 'force-password-reset'] as const;
type BulkAction = (typeof BULK_ACTIONS)[number];

@Controller('admin/players')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminPlayersController {
  constructor(
    private readonly players: PlayersService,
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
  ) {}

  /// Cifrele de sus și panourile de jos. Separate de listă: se schimbă mult
  /// mai rar decât pagina curentă de rezultate și n-au de ce să fie recalculate
  /// la fiecare răsfoire.
  @Get('stats')
  stats() {
    return this.players.stats();
  }

  @Get()
  list(@Query() query: Record<string, string>) {
    const parsed: PlayerListQuery = {
      search: query.search,
      region: query.region,
      status: query.status,
      role: query.role,
      plan: query.plan,
      page: Number(query.page) || 1,
      pageSize: Number(query.pageSize) || 10,
      sort: query.sort as PlayerListQuery['sort'],
      joinedFrom: query.joinedFrom,
      joinedTo: query.joinedTo,
      dir: query.dir === 'asc' ? 'asc' : 'desc',
    };
    return this.players.list(parsed);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.players.detail(id);
  }

  /// Dezvăluirea e-mailului complet.
  ///
  /// Endpoint separat și scris în audit: o dată personală nu trebuie să circule
  /// odată cu lista, iar cine a citit-o trebuie să rămână consemnat.
  @Post(':id/reveal-email')
  @AdminRoles('ADMIN', 'SUPPORT')
  async revealEmail(@Param('id') id: string, @Req() request: Request) {
    const result = await this.players.revealEmail(id);
    await this.audit.record(request.user as AuthenticatedUser, request, {
      action: 'player.email.reveal',
      targetType: 'user',
      targetId: id,
      targetUserId: id,
    });
    return result;
  }

  /// Acțiuni în masă peste conturile bifate în tabel.
  ///
  /// Fiecare cont e tratat separat și raportat separat: o eroare pe un singur
  /// rând n-are voie să facă restul operației să pară că n-a avut loc.
  @Post('bulk')
  @AdminRoles('ADMIN', 'MODERATOR')
  async bulk(
    @Body() body: { action?: string; ids?: string[] },
    @Req() request: Request,
  ) {
    const action = body.action as BulkAction;
    if (!BULK_ACTIONS.includes(action)) {
      throw new BadRequestException(`Acțiune necunoscută: ${String(body.action)}`);
    }

    const ids = [...new Set(body.ids ?? [])];
    if (ids.length === 0) throw new BadRequestException('Niciun cont selectat.');
    if (ids.length > BULK_LIMIT) {
      throw new BadRequestException(`Cel mult ${BULK_LIMIT} conturi într-o singură acțiune.`);
    }

    const actor = request.user as AuthenticatedUser | undefined;
    // Un administrator nu se poate suspenda singur din greșeală în timp ce
    // curăță o listă: s-ar bloca afară din propriul panou.
    const targets = ids.filter((id) => id !== actor?.id);
    const skippedSelf = ids.length - targets.length;

    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of targets) {
      try {
        await this.applyOne(action, id);
        results.push({ id, ok: true });
      } catch (cause) {
        results.push({ id, ok: false, error: cause instanceof Error ? cause.message : 'eșec' });
      }
    }

    const succeeded = results.filter((row) => row.ok).length;
    await this.audit.record(actor as AuthenticatedUser, request, {
      action: `player.bulk.${action}`,
      targetType: 'user',
      payload: { requested: ids.length, succeeded, skippedSelf },
      success: succeeded === targets.length,
    });

    return { action, requested: ids.length, succeeded, skippedSelf, results };
  }

  private async applyOne(action: BulkAction, id: string): Promise<void> {
    switch (action) {
      case 'suspend':
        await this.prisma.user.update({ where: { id }, data: { bannedAt: new Date() } });
        // Un cont suspendat cu sesiuni vii ar rămâne conectat până la expirare.
        await this.prisma.userSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return;
      case 'unsuspend':
        await this.prisma.user.update({ where: { id }, data: { bannedAt: null } });
        return;
      case 'revoke-sessions':
        await this.prisma.userSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        return;
      case 'force-password-reset': {
        const user = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });
        if (user) await this.auth.requestPasswordReset(user.email);
        return;
      }
    }
  }
}
