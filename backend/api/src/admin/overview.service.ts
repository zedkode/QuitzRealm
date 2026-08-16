import { Injectable } from '@nestjs/common';
import { MatchStatus, PurchaseStatus, QuestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 86_400_000;

/// Un panou pentru care nu există încă sursă de date.
///
/// Se întoarce explicit, nu ca zero: un tablou de bord care arată „0 campanii"
/// pentru ceva ce nu e implementat minte la fel de tare ca unul care arată o
/// cifră inventată.
export interface NotInstrumented {
  available: false;
  reason: string;
}

const notInstrumented = (reason: string): NotInstrumented => ({ available: false, reason });

interface DailyRow {
  day: Date;
  active_players: bigint;
  new_players: bigint;
  matches_played: bigint;
  questions_answered: bigint;
}

@Injectable()
export class OverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async build(days = 7) {
    const window = Math.min(Math.max(days, 1), 90);
    const now = new Date();
    const dayAgo = new Date(now.getTime() - DAY_MS);
    const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS);
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const monthAgo = new Date(now.getTime() - 30 * DAY_MS);
    const twoMonthsAgo = new Date(now.getTime() - 60 * DAY_MS);
    const seriesFrom = new Date(now.getTime() - window * DAY_MS);

    const databaseLatencyMs = await this.pingDatabase();

    const [
      activeNow, activeYesterday,
      dau, mau,
      liveMatches, liveMatchesYesterday,
      pendingReports, reportsYesterday,
      totalQuestions, questionsThisWeek, pendingQuestions,
      revenue30d, revenuePrev30d,
      series, recentActivity, topPlayers, recentTransactions,
    ] = await Promise.all([
      this.distinctSessionUsers(dayAgo),
      this.distinctSessionUsers(twoDaysAgo, dayAgo),
      this.distinctSessionUsers(dayAgo),
      this.distinctSessionUsers(monthAgo),
      this.prisma.match.count({ where: { status: MatchStatus.ACTIVE } }),
      this.prisma.match.count({ where: { startedAt: { gte: twoDaysAgo, lt: dayAgo } } }),
      this.prisma.chatReport.count({ where: { resolution: 'PENDING' } }),
      this.prisma.chatReport.count({ where: { createdAt: { gte: twoDaysAgo, lt: dayAgo } } }),
      this.prisma.question.count(),
      this.prisma.question.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.question.count({ where: { status: QuestionStatus.PENDING } }),
      this.revenueCents(monthAgo, now),
      this.revenueCents(twoMonthsAgo, monthAgo),
      this.dailySeries(seriesFrom),
      this.recentActivity(),
      this.topPlayers(),
      this.recentTransactions(),
    ]);

    return {
      generatedAt: now.toISOString(),
      kpis: {
        activePlayers: { value: activeNow, previous: activeYesterday },
        engagement: {
          dau,
          mau,
          ratioPct: mau === 0 ? 0 : Math.round((dau / mau) * 1000) / 10,
        },
        liveMatches: { value: liveMatches, previous: liveMatchesYesterday },
        pendingReports: { value: pendingReports, previous: reportsYesterday },
        totalQuestions: { value: totalQuestions, addedThisWeek: questionsThisWeek },
        activeCampaigns: notInstrumented(
          'Campaniile sezoniere nu există încă în backend: nu există model de campanie, sezon sau facțiune.',
        ),
        revenue: {
          cents: revenue30d,
          previousCents: revenuePrev30d,
          currency: 'RON',
        },
        serverUptimeSeconds: Math.floor(process.uptime()),
      },
      series,
      recentActivity,
      moderation: {
        pendingReports,
        questionSubmissions: pendingQuestions,
        chatBanRequests: notInstrumented('Nu există o coadă separată de cereri de ban pe chat.'),
        appeals: notInstrumented('Nu există un flux de contestații.'),
      },
      services: [
        { key: 'api', name: 'Web API', status: 'up', latencyMs: null, uptimePct: null },
        { key: 'database', name: 'Database', status: 'up', latencyMs: databaseLatencyMs, uptimePct: null },
        { key: 'game', name: 'Game Engine', status: 'unknown', latencyMs: null, uptimePct: null },
        { key: 'matchmaking', name: 'Matchmaking', status: 'unknown', latencyMs: null, uptimePct: null },
        { key: 'realtime', name: 'Realtime Gateway', status: 'unknown', latencyMs: null, uptimePct: null },
        { key: 'payments', name: 'Payments', status: 'not_configured', latencyMs: null, uptimePct: null },
        { key: 'cdn', name: 'CDN / Assets', status: 'unknown', latencyMs: null, uptimePct: null },
      ],
      campaign: notInstrumented(
        'Nu există campanii sezoniere în backend. Ar cere modele de sezon, facțiune și teritoriu persistent.',
      ),
      warMap: notInstrumented(
        'Harta persistentă a României nu există: partidele folosesc hărți hexagonale generate per meci, fără stăpânire între meciuri.',
      ),
      topPlayers,
      recentTransactions,
    };
  }

  /// Câți utilizatori distincți au avut o sesiune activă în interval.
  private async distinctSessionUsers(from: Date, to?: Date): Promise<number> {
    const rows = await this.prisma.userSession.findMany({
      where: { lastSeenAt: to ? { gte: from, lt: to } : { gte: from }, revokedAt: null },
      distinct: ['userId'],
      select: { userId: true },
    });
    return rows.length;
  }

  private async revenueCents(from: Date, to: Date): Promise<number> {
    const result = await this.prisma.purchase.aggregate({
      where: { status: PurchaseStatus.PAID, paidAt: { gte: from, lt: to } },
      _sum: { priceCents: true },
    });
    return result._sum.priceCents ?? 0;
  }

  /// Seria zilnică. Agregarea se face în baza de date, nu în Node.
  ///
  /// `match_events` nu are moment propriu, deci răspunsurile se datează după
  /// începutul partidei — singura dată reală disponibilă.
  private async dailySeries(from: Date) {
    const rows = await this.prisma.$queryRaw<DailyRow[]>`
      WITH days AS (
        SELECT generate_series(date_trunc('day', ${from}::timestamp),
                               date_trunc('day', now()),
                               '1 day')::timestamp AS day
      )
      SELECT d.day,
             COALESCE((SELECT COUNT(DISTINCT mp."user_id") FROM "match_players" mp
                        JOIN "matches" m ON m."id" = mp."match_id"
                       WHERE date_trunc('day', m."started_at") = d.day), 0)::bigint AS active_players,
             COALESCE((SELECT COUNT(*) FROM "users" u
                       WHERE date_trunc('day', u."created_at") = d.day), 0)::bigint AS new_players,
             COALESCE((SELECT COUNT(*) FROM "matches" m
                       WHERE date_trunc('day', m."started_at") = d.day), 0)::bigint AS matches_played,
             COALESCE((SELECT COUNT(*) FROM "match_events" e
                        JOIN "matches" m ON m."id" = e."match_id"
                       WHERE date_trunc('day', m."started_at") = d.day), 0)::bigint AS questions_answered
      FROM days d
      ORDER BY d.day
    `;

    return rows.map((row) => ({
      day: row.day,
      activePlayers: Number(row.active_players),
      newPlayers: Number(row.new_players),
      matchesPlayed: Number(row.matches_played),
      questionsAnswered: Number(row.questions_answered),
    }));
  }

  /// Fluxul de activitate, construit doar din evenimente petrecute cu adevărat.
  private async recentActivity() {
    const [reports, questions, matches, purchases, auditEntries] = await Promise.all([
      this.prisma.chatReport.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, scope: true, reportedUser: { select: { username: true } } },
      }),
      this.prisma.question.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, status: true, text: true },
      }),
      this.prisma.match.findMany({
        take: 4,
        where: { startedAt: { not: null } },
        orderBy: { startedAt: 'desc' },
        select: { id: true, startedAt: true, mode: true },
      }),
      this.prisma.purchase.findMany({
        take: 4,
        where: { status: PurchaseStatus.PAID },
        orderBy: { paidAt: 'desc' },
        select: { id: true, paidAt: true, priceCents: true, currency: true, user: { select: { username: true } } },
      }),
      this.prisma.adminAuditLog.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: { id: true, createdAt: true, action: true, actor: { select: { username: true } } },
      }),
    ]);

    const entries = [
      ...reports.map((row) => ({
        kind: 'report' as const,
        title: 'Jucător raportat',
        subtitle: `${row.reportedUser.username} · ${row.scope}`,
        at: row.createdAt,
      })),
      ...questions.map((row) => ({
        kind: 'question' as const,
        title: row.status === QuestionStatus.APPROVED ? 'Întrebare aprobată' : 'Întrebare trimisă',
        subtitle: row.text.slice(0, 60),
        at: row.createdAt,
      })),
      ...matches.map((row) => ({
        kind: 'match' as const,
        title: 'Partidă începută',
        subtitle: String(row.mode),
        at: row.startedAt as Date,
      })),
      ...purchases.map((row) => ({
        kind: 'payment' as const,
        title: 'Plată încasată',
        subtitle: `${(row.priceCents / 100).toFixed(2)} ${row.currency} · ${row.user.username}`,
        at: row.paidAt as Date,
      })),
      ...auditEntries.map((row) => ({
        kind: 'admin' as const,
        title: 'Acțiune de administrare',
        subtitle: `${row.action} · ${row.actor.username}`,
        at: row.createdAt,
      })),
    ];

    return entries
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 6)
      .map((entry) => ({ ...entry, at: entry.at.toISOString() }));
  }

  /// Primii jucători după ELO — metrica reală de influență din joc.
  private async topPlayers() {
    const players = await this.prisma.user.findMany({
      take: 5,
      orderBy: { eloRating: 'desc' },
      select: {
        id: true,
        username: true,
        eloRating: true,
        matchPlayers: { select: { result: true } },
      },
    });

    return players.map((player) => {
      const matches = player.matchPlayers.length;
      const wins = player.matchPlayers.filter((row) => row.result === 'WIN').length;
      return {
        id: player.id,
        username: player.username,
        eloRating: player.eloRating,
        matches,
        winRatePct: matches === 0 ? null : Math.round((wins / matches) * 1000) / 10,
      };
    });
  }

  private async recentTransactions() {
    const rows = await this.prisma.purchase.findMany({
      take: 5,
      where: { status: PurchaseStatus.PAID },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true, priceCents: true, currency: true, paidAt: true,
        user: { select: { username: true } },
        gemPack: { select: { name: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      player: row.user.username,
      item: row.gemPack.name,
      priceCents: row.priceCents,
      currency: row.currency,
      at: row.paidAt?.toISOString() ?? null,
    }));
  }

  /// Latența reală a bazei de date, măsurată acum.
  private async pingDatabase(): Promise<number | null> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return Date.now() - started;
    } catch {
      return null;
    }
  }
}
