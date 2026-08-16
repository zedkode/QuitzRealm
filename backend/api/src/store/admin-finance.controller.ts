import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrencyKind, LedgerReason, PurchaseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { AdminRoles } from '../admin/admin-roles.decorator';

/// Rapoartele financiare.
///
/// Toate cifrele vin din `purchases` și `currency_ledger`, nu din solduri:
/// soldul spune doar unde s-a ajuns, registrul spune cum. Sumele de bani rămân
/// în cea mai mică unitate (bani/cenți) până la afișare.
@Controller('admin/finance')
@UseGuards(JwtAuthGuard, AdminGuard)
@AdminRoles('ADMIN')
export class AdminFinanceController {
  constructor(private readonly prisma: PrismaService) {}

  /// Rezumatul pe o fereastră de zile (implicit 30).
  @Get('summary')
  async summary(@Query('days') days = '30') {
    const window = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - window * 86_400_000);

    const [paid, byStatus, payingUsers, gemsFlow, topPacks] = await Promise.all([
      this.prisma.purchase.aggregate({
        where: { status: PurchaseStatus.PAID, paidAt: { gte: since } },
        _sum: { priceCents: true, gemsGranted: true },
        _count: { _all: true },
      }),
      this.prisma.purchase.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.purchase.findMany({
        where: { status: PurchaseStatus.PAID, paidAt: { gte: since } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.prisma.currencyLedger.groupBy({
        by: ['reason'],
        where: { currency: CurrencyKind.GEMS, createdAt: { gte: since } },
        _sum: { delta: true },
      }),
      this.prisma.purchase.groupBy({
        by: ['gemPackId'],
        where: { status: PurchaseStatus.PAID, paidAt: { gte: since } },
        _sum: { priceCents: true },
        _count: { _all: true },
        orderBy: { _sum: { priceCents: 'desc' } },
        take: 5,
      }),
    ]);

    const packNames = await this.prisma.gemPack.findMany({
      where: { id: { in: topPacks.map((row) => row.gemPackId) } },
      select: { id: true, code: true, name: true, currency: true },
    });

    const revenueCents = paid._sum.priceCents ?? 0;
    const payerCount = payingUsers.length;
    const flowFor = (reason: LedgerReason) =>
      gemsFlow.find((row) => row.reason === reason)?._sum.delta ?? 0;

    return {
      windowDays: window,
      revenueCents,
      purchasesPaid: paid._count._all,
      gemsSold: paid._sum.gemsGranted ?? 0,
      payingUsers: payerCount,
      /// Venit mediu per plătitor. Zero plătitori => zero, nu împărțire la zero.
      averageRevenuePerPayerCents: payerCount === 0 ? 0 : Math.round(revenueCents / payerCount),
      purchasesByStatus: Object.fromEntries(
        byStatus.map((row) => [row.status, row._count._all]),
      ),
      gems: {
        fromPurchases: flowFor(LedgerReason.PURCHASE),
        fromAdminGrants: flowFor(LedgerReason.ADMIN_GRANT),
        fromRewards: flowFor(LedgerReason.REWARD),
        spent: flowFor(LedgerReason.SPEND),
        refunded: flowFor(LedgerReason.REFUND),
      },
      topPacks: topPacks.map((row) => ({
        ...packNames.find((pack) => pack.id === row.gemPackId),
        revenueCents: row._sum.priceCents ?? 0,
        purchases: row._count._all,
      })),
    };
  }

  /// Venitul pe zile, pentru grafic.
  @Get('revenue-series')
  async revenueSeries(@Query('days') days = '30') {
    const window = Math.min(Math.max(Number(days) || 30, 1), 365);
    const since = new Date(Date.now() - window * 86_400_000);

    // Agregarea pe zi se face în baza de date: aducerea tuturor achizițiilor în
    // Node ar merge acum, cu puține rânduri, și ar cădea exact când raportul
    // începe să conteze.
    return this.prisma.$queryRaw<Array<{ day: Date; revenue_cents: bigint; purchases: bigint }>>`
      SELECT date_trunc('day', "paid_at") AS day,
             SUM("price_cents")::bigint   AS revenue_cents,
             COUNT(*)::bigint             AS purchases
      FROM "purchases"
      WHERE "status" = 'paid' AND "paid_at" >= ${since}
      GROUP BY 1
      ORDER BY 1
    `.then((rows) =>
      rows.map((row) => ({
        day: row.day,
        revenueCents: Number(row.revenue_cents),
        purchases: Number(row.purchases),
      })),
    );
  }

  /// Achizițiile recente, pentru verificarea plăților una câte una.
  @Get('purchases')
  purchases(@Query('status') status?: string, @Query('limit') limit = '50') {
    const parsed = Object.values(PurchaseStatus).find((value) => value === status);
    return this.prisma.purchase.findMany({
      where: parsed ? { status: parsed } : undefined,
      take: Math.min(Math.max(Number(limit) || 50, 1), 200),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, status: true, provider: true, providerSessionId: true,
        priceCents: true, currency: true, gemsGranted: true,
        createdAt: true, paidAt: true, refundedAt: true, failureReason: true,
        user: { select: { id: true, username: true, email: true } },
        gemPack: { select: { code: true, name: true } },
      },
    });
  }

  /// Jurnalul de administrare: cine ce a făcut.
  @Get('audit')
  audit(@Query('action') action?: string, @Query('limit') limit = '100') {
    return this.prisma.adminAuditLog.findMany({
      where: action ? { action: { startsWith: action } } : undefined,
      take: Math.min(Math.max(Number(limit) || 100, 1), 300),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, action: true, actorRole: true, targetType: true, targetId: true,
        payload: true, ip: true, success: true, createdAt: true,
        actor: { select: { id: true, username: true } },
        targetUser: { select: { id: true, username: true } },
      },
    });
  }
}
