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

const derived = (pct: number, basis: string): DerivedPct => ({
  pct: Math.round(Math.min(Math.max(pct, 0), 100) * 10) / 10,
  basis,
});

/// Variația procentuală față de perioada anterioară.
///
/// `null` când nu există bază de comparație: „+100%" pornind de la zero e o
/// afirmație goală, iar un tablou de bord nu trebuie să facă afirmații goale.
const deltaPct = (current: number, previous: number): number | null =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

interface DailyRow {
  day: Date;
  active_players: bigint;
  new_players: bigint;
  matches_played: bigint;
  questions_answered: bigint;
}

interface GrowthRow {
  day: Date;
  new_players: bigint;
  returning_players: bigint;
  total_players: bigint;
  matches_played: bigint;
  questions_total: bigint;
  new_reports: bigint;
  revenue_cents: bigint;
}

/// Procent derivat, însoțit de explicația din care a ieșit.
///
/// Fără `basis`, un „74%" pe un indicator compus e o cifră pe care nimeni nu o
/// poate verifica și în care nimeni n-ar trebui să aibă încredere.
export interface DerivedPct {
  pct: number;
  basis: string;
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
      growth, storeRevenue, coinEconomy, approvedQuestions, resolvedReports, totalReports,
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
      this.growthSeries(),
      this.storeRevenue(now),
      this.coinEconomy(monthAgo),
      this.prisma.question.count({ where: { status: QuestionStatus.APPROVED } }),
      this.prisma.chatReport.count({ where: { resolution: { not: 'PENDING' } } }),
      this.prisma.chatReport.count(),
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

      growth,
      storeRevenue,
      coinEconomy,

      /// Coada de revizuire. Numărul total e real; împărțirea pe priorități nu
      /// are sursă, pentru că întrebările n-au câmp de prioritate.
      questionQueue: {
        total: pendingQuestions,
        buckets: notInstrumented(
          'Întrebările n-au câmp de prioritate. Ar cere `Question.priority` sau o regulă care să o deducă din numărul de rapoarte.',
        ),
      },

      events: notInstrumented('Nu există model de eveniment: nici activ, nici programat.'),
      challenges: notInstrumented('Nu există model de provocare, deci nici progres de urmărit.'),
      notifications: notInstrumented(
        'Nu există furnizor de notificări configurat și nici model care să rețină ce s-a trimis.',
      ),

      moderationAlerts: {
        chatReports: pendingReports,
        playerReports: notInstrumented(
          'Rapoartele generale de comportament n-au model separat; azi există doar `ChatReport`.',
        ),
        offensiveNames: notInstrumented('Nu există verificare de nume ofensatoare.'),
        cheatingReports: notInstrumented('Nu există detecție de trișare.'),
      },

      platformOverview: {
        contentCoverage: derived(
          totalQuestions === 0 ? 0 : (approvedQuestions / totalQuestions) * 100,
          `${approvedQuestions} din ${totalQuestions} întrebări sunt aprobate`,
        ),
        playerEngagement: derived(
          mau === 0 ? 0 : (dau / mau) * 100,
          `${dau} activi azi din ${mau} activi în ultimele 30 de zile`,
        ),
        economyBalance: derived(
          coinEconomy.minted30d === 0 ? 0 : (coinEconomy.spent30d / coinEconomy.minted30d) * 100,
          `${coinEconomy.spent30d} monede cheltuite față de ${coinEconomy.minted30d} emise în 30 de zile`,
        ),
        communityHealth: derived(
          totalReports === 0 ? 100 : (resolvedReports / totalReports) * 100,
          totalReports === 0
            ? 'Niciun raport de moderare până acum'
            : `${resolvedReports} din ${totalReports} rapoarte rezolvate`,
        ),
        systemPerformance: derived(
          databaseLatencyMs === null ? 0 : Math.max(0, 100 - databaseLatencyMs),
          databaseLatencyMs === null
            ? 'Baza de date nu a răspuns la sondaj'
            : `Baza de date răspunde în ${databaseLatencyMs} ms`,
        ),
      },
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

  /// Creșterea pe 30 de zile: conturi noi, conturi întoarse și total cumulat.
  ///
  /// „Întors" înseamnă un cont care a avut sesiune în ziua respectivă, dar s-a
  /// înregistrat mai devreme — altfel un cont nou ar fi numărat de două ori.
  private async growthSeries() {
    const rows = await this.prisma.$queryRaw<GrowthRow[]>`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '29 days',
                               date_trunc('day', now()),
                               '1 day')::timestamp AS day
      )
      SELECT d.day,
             (SELECT COUNT(*) FROM "users" u
               WHERE date_trunc('day', u."created_at") = d.day)::bigint AS new_players,
             (SELECT COUNT(DISTINCT s."user_id") FROM "user_sessions" s
                JOIN "users" u ON u."id" = s."user_id"
               WHERE date_trunc('day', s."last_seen_at") = d.day
                 AND date_trunc('day', u."created_at") < d.day)::bigint AS returning_players,
             (SELECT COUNT(*) FROM "users" u
               WHERE u."created_at" < d.day + interval '1 day')::bigint AS total_players,
             (SELECT COUNT(*) FROM "matches" m
               WHERE date_trunc('day', m."started_at") = d.day)::bigint AS matches_played,
             (SELECT COUNT(*) FROM "questions" q
               WHERE q."created_at" < d.day + interval '1 day')::bigint AS questions_total,
             (SELECT COUNT(*) FROM "chat_reports" r
               WHERE date_trunc('day', r."created_at") = d.day)::bigint AS new_reports,
             (SELECT COALESCE(SUM(p."price_cents"), 0) FROM "purchases" p
               WHERE p."status" = 'paid'
                 AND date_trunc('day', p."paid_at") = d.day)::bigint AS revenue_cents
      FROM days d
      ORDER BY d.day
    `;

    const series = rows.map((row) => ({
      day: row.day,
      newPlayers: Number(row.new_players),
      returningPlayers: Number(row.returning_players),
      totalPlayers: Number(row.total_players),
      matchesPlayed: Number(row.matches_played),
      questionsTotal: Number(row.questions_total),
      newReports: Number(row.new_reports),
      revenueCents: Number(row.revenue_cents),
    }));

    // Ultimele 15 zile față de cele 15 dinainte: o comparație pe ferestre egale
    // e singura care face procentul comparabil.
    const half = Math.floor(series.length / 2);
    const sum = (from: number, to: number, key: 'newPlayers' | 'returningPlayers') =>
      series.slice(from, to).reduce((total, point) => total + point[key], 0);

    const newRecent = sum(half, series.length, 'newPlayers');
    const newPrevious = sum(0, half, 'newPlayers');
    const returningRecent = sum(half, series.length, 'returningPlayers');
    const returningPrevious = sum(0, half, 'returningPlayers');

    return {
      series,
      summary: {
        newPlayers: { value: newRecent, deltaPct: deltaPct(newRecent, newPrevious) },
        returningPlayers: { value: returningRecent, deltaPct: deltaPct(returningRecent, returningPrevious) },
        totalGrowth: {
          value: newRecent + returningRecent,
          deltaPct: deltaPct(newRecent + returningRecent, newPrevious + returningPrevious),
        },
      },
    };
  }

  /// Venitul din bani reali, pe cele trei ferestre din tabloul de bord.
  private async storeRevenue(now: Date) {
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday.getTime() - DAY_MS);
    const sevenAgo = new Date(now.getTime() - 7 * DAY_MS);
    const fourteenAgo = new Date(now.getTime() - 14 * DAY_MS);
    const thirtyAgo = new Date(now.getTime() - 30 * DAY_MS);
    const sixtyAgo = new Date(now.getTime() - 60 * DAY_MS);

    const [today, yesterday, week, previousWeek, month, previousMonth, topRows] = await Promise.all([
      this.revenueCents(startOfToday, now),
      this.revenueCents(startOfYesterday, startOfToday),
      this.revenueCents(sevenAgo, now),
      this.revenueCents(fourteenAgo, sevenAgo),
      this.revenueCents(thirtyAgo, now),
      this.revenueCents(sixtyAgo, thirtyAgo),
      this.prisma.purchase.groupBy({
        by: ['gemPackId'],
        where: { status: PurchaseStatus.PAID, paidAt: { gte: startOfToday } },
        _sum: { priceCents: true },
        orderBy: { _sum: { priceCents: 'desc' } },
        take: 1,
      }),
    ]);

    let topItem: { name: string; cents: number } | null = null;
    if (topRows.length > 0) {
      const pack = await this.prisma.gemPack.findUnique({
        where: { id: topRows[0].gemPackId },
        select: { name: true },
      });
      topItem = { name: pack?.name ?? 'Pachet șters', cents: topRows[0]._sum.priceCents ?? 0 };
    }

    return {
      currency: 'RON',
      today: { cents: today, deltaPct: deltaPct(today, yesterday) },
      sevenDays: { cents: week, deltaPct: deltaPct(week, previousWeek) },
      thirtyDays: { cents: month, deltaPct: deltaPct(month, previousMonth) },
      topItem,
    };
  }

  /// Economia de monede, citită din registru, nu din soldurile de pe conturi:
  /// soldul spune cât e acum, registrul spune de unde vine.
  private async coinEconomy(monthAgo: Date) {
    const [minted, spent, circulation, topSink] = await Promise.all([
      this.prisma.currencyLedger.aggregate({
        where: { currency: 'COINS', delta: { gt: 0 }, createdAt: { gte: monthAgo } },
        _sum: { delta: true },
      }),
      this.prisma.currencyLedger.aggregate({
        where: { currency: 'COINS', delta: { lt: 0 }, createdAt: { gte: monthAgo } },
        _sum: { delta: true },
      }),
      this.prisma.user.aggregate({ _sum: { coins: true } }),
      this.prisma.currencyLedger.groupBy({
        by: ['referenceType'],
        where: { currency: 'COINS', delta: { lt: 0 }, createdAt: { gte: monthAgo } },
        _sum: { delta: true },
        orderBy: { _sum: { delta: 'asc' } },
        take: 1,
      }),
    ]);

    const minted30d = minted._sum.delta ?? 0;
    const spent30d = Math.abs(spent._sum.delta ?? 0);

    return {
      minted30d,
      spent30d,
      circulation: circulation._sum.coins ?? 0,
      /// Sănătoasă cât timp nu se emite mult mai mult decât se consumă.
      healthy: minted30d === 0 || spent30d >= minted30d * 0.6,
      topSink: topSink.length > 0
        ? { label: topSink[0].referenceType ?? 'Nespecificat', amount: Math.abs(topSink[0]._sum.delta ?? 0) }
        : null,
    };
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
