import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, Req, UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrencyKind, LedgerReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { AdminRoles } from '../admin/admin-roles.decorator';
import { AuditService } from '../admin/audit.service';
import type { AuthenticatedUser } from '../auth/auth.types';
import { GrantCurrencyDto, UpsertGemPackDto, UpsertPowerupDto } from './dto/admin-store.dto';
import { WalletService } from './wallet.service';

type AdminRequest = Request & { user: AuthenticatedUser };

/// Administrarea magazinului.
///
/// Tot controllerul e rezervat rolului `ADMIN`: aici se schimbă prețuri și se
/// acordă valoare, iar moderarea de chat sau editarea de întrebări nu au ce
/// căuta în asta.
@Controller('admin/store')
@UseGuards(JwtAuthGuard, AdminGuard)
@AdminRoles('ADMIN')
export class AdminStoreController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly wallet: WalletService,
  ) {}

  // --- Powerups ------------------------------------------------------------

  @Get('powerups')
  listPowerups() {
    return this.prisma.powerup.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Post('powerups')
  async createPowerup(@Body() dto: UpsertPowerupDto, @Req() request: AdminRequest) {
    const powerup = await this.prisma.powerup.create({ data: { ...dto } });
    await this.audit.record(request.user, request, {
      action: 'store.powerup.create',
      targetType: 'powerup',
      targetId: powerup.id,
      payload: dto,
    });
    return powerup;
  }

  @Put('powerups/:id')
  async updatePowerup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertPowerupDto,
    @Req() request: AdminRequest,
  ) {
    const powerup = await this.prisma.powerup.update({ where: { id }, data: { ...dto } });
    await this.audit.record(request.user, request, {
      action: 'store.powerup.update',
      targetType: 'powerup',
      targetId: id,
      payload: dto,
    });
    return powerup;
  }

  /// Retrage din vânzare. Nu șterge: jucătorii care l-au cumpărat trebuie să-l
  /// poată folosi mai departe, iar rapoartele vechi trebuie să-l poată numi.
  @Delete('powerups/:id')
  async retirePowerup(@Param('id', ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    const powerup = await this.prisma.powerup.update({
      where: { id },
      data: { active: false },
    });
    await this.audit.record(request.user, request, {
      action: 'store.powerup.retire',
      targetType: 'powerup',
      targetId: id,
    });
    return powerup;
  }

  // --- Pachete de gems -----------------------------------------------------

  @Get('gem-packs')
  listGemPacks() {
    return this.prisma.gemPack.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Post('gem-packs')
  async createGemPack(@Body() dto: UpsertGemPackDto, @Req() request: AdminRequest) {
    const pack = await this.prisma.gemPack.create({ data: { ...dto } });
    await this.audit.record(request.user, request, {
      action: 'store.gempack.create',
      targetType: 'gem_pack',
      targetId: pack.id,
      payload: dto,
    });
    return pack;
  }

  @Put('gem-packs/:id')
  async updateGemPack(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertGemPackDto,
    @Req() request: AdminRequest,
  ) {
    const pack = await this.prisma.gemPack.update({ where: { id }, data: { ...dto } });
    await this.audit.record(request.user, request, {
      action: 'store.gempack.update',
      targetType: 'gem_pack',
      targetId: id,
      payload: dto,
    });
    return pack;
  }

  @Delete('gem-packs/:id')
  async retireGemPack(@Param('id', ParseUUIDPipe) id: string, @Req() request: AdminRequest) {
    const pack = await this.prisma.gemPack.update({ where: { id }, data: { active: false } });
    await this.audit.record(request.user, request, {
      action: 'store.gempack.retire',
      targetType: 'gem_pack',
      targetId: id,
    });
    return pack;
  }

  // --- Acordare manuală ----------------------------------------------------

  /// Adaugă sau scade monedă dintr-un cont, cu motiv obligatoriu.
  ///
  /// Trece prin `WalletService`, deci lasă linie în registru exact ca o
  /// cumpărare: un raport financiar trebuie să poată separa ce s-a încasat de
  /// ce s-a dăruit.
  @Post('users/:id/currency')
  async grantCurrency(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GrantCurrencyDto,
    @Req() request: AdminRequest,
  ) {
    const balanceAfter = await this.wallet.applyStandalone({
      userId: id,
      currency: dto.currency,
      delta: dto.amount,
      reason: LedgerReason.ADMIN_GRANT,
      actorId: request.user.id,
      note: dto.reason,
    });
    await this.audit.record(request.user, request, {
      action: 'store.currency.grant',
      targetType: 'user',
      targetId: id,
      targetUserId: id,
      payload: dto,
    });
    return { userId: id, currency: dto.currency, delta: dto.amount, balanceAfter };
  }

  /// Registrul unui cont: de unde are ce are.
  @Get('users/:id/ledger')
  ledger(@Param('id', ParseUUIDPipe) id: string, @Query('limit') limit = '50') {
    return this.prisma.currencyLedger.findMany({
      where: { userId: id },
      take: Math.min(Math.max(Number(limit) || 50, 1), 200),
      orderBy: { createdAt: 'desc' },
    });
  }

  /// Balanțele agregate, ca verificare a integrității.
  ///
  /// Suma mișcărilor din registru trebuie să fie egală cu soldul de pe cont.
  /// O diferență înseamnă că cineva a scris direct în `users`, ocolind
  /// registrul — exact ce trebuie să fie imposibil.
  @Get('users/:id/reconcile')
  async reconcile(@Param('id', ParseUUIDPipe) id: string) {
    const [user, sums] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id },
        select: { coins: true, gems: true },
      }),
      this.prisma.currencyLedger.groupBy({
        by: ['currency'],
        where: { userId: id },
        _sum: { delta: true },
      }),
    ]);

    const ledgerFor = (currency: CurrencyKind) =>
      sums.find((row) => row.currency === currency)?._sum.delta ?? 0;

    const coinsLedger = ledgerFor(CurrencyKind.COINS);
    const gemsLedger = ledgerFor(CurrencyKind.GEMS);

    return {
      coins: { balance: user.coins, ledger: coinsLedger, matches: user.coins === coinsLedger },
      gems: { balance: user.gems, ledger: gemsLedger, matches: user.gems === gemsLedger },
    };
  }
}
