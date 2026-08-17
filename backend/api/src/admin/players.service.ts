import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminRole, Prisma, PurchaseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { tierFor, TRUST_TIER_COUNT } from '../chat/trust-tier';
import { CONTINENTS, continentOf, countriesIn } from './continents';

const DAY_MS = 86_400_000;
/// Sub cinci minute de la ultima activitate a sesiunii se consideră „online
/// acum"; între asta și o zi, „inactiv". E singurul semnal de prezență pe care
/// îl are contul, `user_sessions.last_seen_at`.
const ONLINE_WINDOW_MS = 5 * 60_000;
const IDLE_WINDOW_MS = DAY_MS;

export interface NotInstrumented {
  available: false;
  reason: string;
}
const notInstrumented = (reason: string): NotInstrumented => ({ available: false, reason });

export type PlayerStatus = 'ACTIVE' | 'IDLE' | 'OFFLINE' | 'SUSPENDED';

export interface PlayerListQuery {
  search?: string;
  region?: string;
  status?: string;
  role?: string;
  plan?: string;
  page?: number;
  pageSize?: number;
  sort?: 'lastOnline' | 'joinDate' | 'level' | 'reports' | 'player';
  dir?: 'asc' | 'desc';
  joinedFrom?: string;
  joinedTo?: string;
}

interface LastSeenRow {
  user_id: string;
  last_seen_at: Date | null;
  devices: bigint;
}

interface PlayerRow {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  role: string;
  level: number;
  country_code: string | null;
  created_at: Date;
  banned_at: Date | null;
  email_verified_at: Date | null;
  last_seen_at: Date | null;
  reports: number;
  premium: boolean;
}

/// Coloanele după care se poate ordona, ca listă închisă.
///
/// Numele coloanei ajunge în SQL prin `Prisma.raw`, deci nu are voie să vină
/// niciodată din cerere: se alege din tabelul acesta sau se cade pe implicit.
const SORTABLE: Record<string, string> = {
  lastOnline: 's.last_seen_at',
  joinDate: 'u."created_at"',
  level: 'u."level"',
  reports: 'reports',
  player: 'u."username"',
};

function orderFragment(query: PlayerListQuery): Prisma.Sql {
  const column = SORTABLE[query.sort ?? ''] ?? SORTABLE.joinDate;
  const dir = query.dir === 'asc' ? 'ASC' : 'DESC';
  // Conturile fără nicio sesiune se duc la coadă indiferent de direcție: un
  // „niciodată" nu e nici cea mai recentă, nici cea mai veche prezență.
  return Prisma.raw(`${column} ${dir} NULLS LAST`);
}

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------ listare --- */

  /// Lista paginată, în SQL brut.
  ///
  /// Prezența („Last Online") nu e o coloană pe `users`, ci maximul lui
  /// `last_seen_at` peste sesiunile nerevocate. Cu clientul Prisma nu se poate
  /// nici filtra, nici ordona după ea, iar un control de sortare care afișează
  /// „Last Online" dar ordonează în tăcere după altceva e mai rău decât unul
  /// care lipsește. De aici alegerea unui `LEFT JOIN LATERAL`.
  async list(query: PlayerListQuery) {
    const page = Math.max(1, Math.floor(query.page ?? 1));
    const pageSize = Math.min(Math.max(Math.floor(query.pageSize ?? 10), 1), 100);

    const filters = this.filterFragments(query);
    const where = filters.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
      : Prisma.empty;

    const base = Prisma.sql`
      FROM "users" u
      LEFT JOIN LATERAL (
        SELECT MAX(se."last_seen_at") AS last_seen_at
        FROM "user_sessions" se
        WHERE se."user_id" = u."id" AND se."revoked_at" IS NULL
      ) s ON TRUE
      ${where}
    `;

    const [counted, rows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count ${base}`,
      this.prisma.$queryRaw<PlayerRow[]>`
        SELECT u."id"::text AS id,
               u."username",
               u."display_name",
               u."email",
               u."role"::text AS role,
               u."level",
               u."country_code",
               u."created_at",
               u."banned_at",
               u."email_verified_at",
               s.last_seen_at,
               (SELECT COUNT(*) FROM "chat_reports" r WHERE r."reported_user_id" = u."id")::int AS reports,
               EXISTS(SELECT 1 FROM "purchases" p
                       WHERE p."user_id" = u."id" AND p."status" = 'paid') AS premium
        ${base}
        ORDER BY ${orderFragment(query)}
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
      `,
    ]);

    const total = Number(counted[0]?.count ?? 0);

    return {
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
      rows: rows.map((row) => ({
        id: row.id,
        playerId: playerCode(row.id),
        username: row.username,
        displayName: row.display_name ?? row.username,
        level: row.level,
        countryCode: row.country_code,
        role: row.role.toUpperCase(),
        status: statusOf(row.banned_at, row.last_seen_at),
        lastOnlineAt: row.last_seen_at?.toISOString() ?? null,
        joinedAt: row.created_at.toISOString(),
        plan: row.premium ? 'PREMIUM' : 'FREE',
        reports: row.reports,
        emailMasked: maskEmail(row.email),
        verified: row.email_verified_at !== null,
        bannedAt: row.banned_at?.toISOString() ?? null,
      })),
    };
  }

  /// Fiecare filtru, ca fragment parametrizat. Nicio valoare din cerere nu
  /// ajunge concatenată în SQL: toate trec ca parametru.
  private filterFragments(query: PlayerListQuery): Prisma.Sql[] {
    const parts: Prisma.Sql[] = [];

    const search = query.search?.trim();
    if (search) {
      const like = `%${search}%`;
      const code = search.toUpperCase().replace(/^QR-/, '').replace(/[^0-9A-F]/g, '').toLowerCase();
      const byCode = code.length >= 4
        ? Prisma.sql`OR replace(u."id"::text, '-', '') LIKE ${code + '%'}`
        : Prisma.empty;
      parts.push(Prisma.sql`(
        u."username" ILIKE ${like}
        OR u."display_name" ILIKE ${like}
        OR u."email" ILIKE ${like}
        ${byCode}
      )`);
    }

    if (query.role && query.role !== 'ALL') {
      parts.push(Prisma.sql`u."role"::text = ${query.role.toLowerCase()}`);
    }

    if (query.plan === 'PREMIUM') {
      parts.push(Prisma.sql`EXISTS(SELECT 1 FROM "purchases" p WHERE p."user_id" = u."id" AND p."status" = 'paid')`);
    } else if (query.plan === 'FREE') {
      parts.push(Prisma.sql`NOT EXISTS(SELECT 1 FROM "purchases" p WHERE p."user_id" = u."id" AND p."status" = 'paid')`);
    }

    if (query.region && query.region !== 'ALL') {
      if (query.region === 'Necunoscut') {
        parts.push(Prisma.sql`u."country_code" IS NULL`);
      } else {
        const codes = countriesIn(query.region);
        parts.push(codes.length > 0
          ? Prisma.sql`u."country_code" = ANY(${codes})`
          : Prisma.sql`FALSE`);
      }
    }

    // Pragurile de prezență trăiesc într-un singur loc (`ONLINE_WINDOW_MS`,
    // `IDLE_WINDOW_MS`) și se trimit ca parametru, ca filtrul din SQL și
    // eticheta calculată de `statusOf` să nu poată ajunge în dezacord.
    const online = new Date(Date.now() - ONLINE_WINDOW_MS);
    const idle = new Date(Date.now() - IDLE_WINDOW_MS);
    switch (query.status) {
      case 'SUSPENDED':
        parts.push(Prisma.sql`u."banned_at" IS NOT NULL`);
        break;
      case 'ACTIVE':
        parts.push(Prisma.sql`u."banned_at" IS NULL AND s.last_seen_at >= ${online}`);
        break;
      case 'IDLE':
        parts.push(Prisma.sql`u."banned_at" IS NULL AND s.last_seen_at >= ${idle} AND s.last_seen_at < ${online}`);
        break;
      case 'OFFLINE':
        parts.push(Prisma.sql`u."banned_at" IS NULL AND (s.last_seen_at IS NULL OR s.last_seen_at < ${idle})`);
        break;
      default:
        break;
    }

    if (query.joinedFrom) {
      parts.push(Prisma.sql`u."created_at" >= ${new Date(query.joinedFrom)}`);
    }
    if (query.joinedTo) {
      // Capătul din dreapta e inclusiv: cine alege „16 mai" se așteaptă să vadă
      // și conturile create în cursul acelei zile.
      const to = new Date(query.joinedTo);
      to.setHours(23, 59, 59, 999);
      parts.push(Prisma.sql`u."created_at" <= ${to}`);
    }

    return parts;
  }

  /// Ultima prezență și numărul de dispozitive pentru un set de conturi.
  private async presenceFor(ids: string[]) {
    const map = new Map<string, { lastSeenAt: Date | null; devices: number }>();
    if (ids.length === 0) return map;

    const rows = await this.prisma.$queryRaw<LastSeenRow[]>`
      SELECT "user_id"::text AS user_id,
             MAX("last_seen_at") AS last_seen_at,
             COUNT(DISTINCT COALESCE("device_label", "id"::text)) AS devices
      FROM "user_sessions"
      WHERE "user_id" = ANY(${ids}::uuid[]) AND "revoked_at" IS NULL
      GROUP BY "user_id"
    `;
    for (const row of rows) {
      map.set(row.user_id, { lastSeenAt: row.last_seen_at, devices: Number(row.devices) });
    }
    return map;
  }

  private async premiumSet(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.prisma.purchase.findMany({
      where: { userId: { in: ids }, status: PurchaseStatus.PAID },
      distinct: ['userId'],
      select: { userId: true },
    });
    return new Set(rows.map((row) => row.userId));
  }

  /* -------------------------------------------------------------- detaliu --- */

  async detail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, displayName: true, email: true, role: true,
        level: true, xp: true, countryCode: true, createdAt: true, bannedAt: true,
        emailVerifiedAt: true, twoFactorEnabledAt: true, correctAnswers: true,
        eloRating: true, coins: true, gems: true, chatMutedUntil: true,
        globalChatShadowBannedUntil: true,
        _count: { select: { chatReportsAgainst: true, chatReportsMade: true, matchPlayers: true } },
      },
    });
    if (!user) throw new NotFoundException('Jucătorul nu există.');

    const presence = await this.presenceFor([id]);
    const seen = presence.get(id);
    const premium = (await this.premiumSet([id])).has(id);

    return {
      id: user.id,
      playerId: playerCode(user.id),
      username: user.username,
      displayName: user.displayName ?? user.username,
      emailMasked: maskEmail(user.email),
      verified: user.emailVerifiedAt !== null,
      level: user.level,
      xp: user.xp,
      eloRating: user.eloRating,
      countryCode: user.countryCode,
      continent: continentOf(user.countryCode),
      role: user.role,
      status: statusOf(user.bannedAt, seen?.lastSeenAt ?? null),
      plan: premium ? 'PREMIUM' : 'FREE',
      joinedAt: user.createdAt.toISOString(),
      lastLoginAt: seen?.lastSeenAt?.toISOString() ?? null,
      linkedDevices: seen?.devices ?? 0,
      reportsAgainst: user._count.chatReportsAgainst,
      reportsMade: user._count.chatReportsMade,
      matches: user._count.matchPlayers,
      coins: user.coins,
      gems: user.gems,
      chatMutedUntil: user.chatMutedUntil?.toISOString() ?? null,
      shadowBannedUntil: user.globalChatShadowBannedUntil?.toISOString() ?? null,
      trust: trustScore({
        correctAnswers: user.correctAnswers,
        emailVerified: user.emailVerifiedAt !== null,
        twoFactor: user.twoFactorEnabledAt !== null,
        reports: user._count.chatReportsAgainst,
        banned: user.bannedAt !== null,
      }),
      /// Limba nu se salvează pe cont: aplicația o ia din setările telefonului.
      language: notInstrumented(
        'Limba preferată nu se salvează pe cont; clientul o ia din setările sistemului.',
      ),
      faction: notInstrumented(
        'Nu există model de facțiune sau campanie, deci un cont nu poate aparține încă niciuneia.',
      ),
    };
  }

  /* -------------------------------------------------------------- cifre --- */

  async stats() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - DAY_MS);
    const twoDaysAgo = new Date(now.getTime() - 2 * DAY_MS);
    const monthAgo = new Date(now.getTime() - 30 * DAY_MS);

    const [
      totalPlayers, totalYesterday,
      activeToday, activeYesterday,
      signups24h, signupsPrev24h,
      flagged, flaggedYesterday,
      premium, regional, growth, segments,
      recentActivity, suspicious, moderationActions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { lt: dayAgo } } }),
      this.distinctActive(dayAgo),
      this.distinctActive(twoDaysAgo, dayAgo),
      this.prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: twoDaysAgo, lt: dayAgo } } }),
      this.flaggedCount(),
      this.prisma.user.count({ where: { bannedAt: { gte: twoDaysAgo, lt: dayAgo } } }),
      this.premiumCount(),
      this.regionalDistribution(),
      this.growthSeries(),
      this.segments(now, monthAgo),
      this.recentActivity(),
      this.suspiciousAccounts(),
      this.moderationActions(),
    ]);

    return {
      generatedAt: now.toISOString(),
      kpis: {
        totalPlayers: { value: totalPlayers, deltaPct: deltaPct(totalPlayers, totalYesterday) },
        activeToday: { value: activeToday, deltaPct: deltaPct(activeToday, activeYesterday) },
        newSignups24h: { value: signups24h, deltaPct: deltaPct(signups24h, signupsPrev24h) },
        flaggedAccounts: { value: flagged, deltaPct: deltaPct(flagged, flaggedYesterday) },
        premiumPlayers: { value: premium, deltaPct: null },
        /// Sesiunile ținute în baza de date sunt sesiuni de refresh token, nu
        /// sesiuni de joc: durata lor se măsoară în zile, nu în minute. A o
        /// arăta ca „timp mediu de sesiune" ar fi o cifră greșită cu încredere.
        avgSessionTime: notInstrumented(
          'Nu se măsoară durata unei sesiuni de joc. `user_sessions` ține sesiuni de autentificare, care trăiesc zile întregi.',
        ),
      },
      growth,
      regional,
      segments,
      recentActivity,
      suspicious,
      moderationActions,
    };
  }

  private async distinctActive(from: Date, to?: Date): Promise<number> {
    const rows = await this.prisma.userSession.findMany({
      where: { lastSeenAt: to ? { gte: from, lt: to } : { gte: from }, revokedAt: null },
      distinct: ['userId'],
      select: { userId: true },
    });
    return rows.length;
  }

  /// „Semnalat" = suspendat, mut pe chat, shadow-ban sau cu rapoarte deschise
  /// împotriva lui. Toate patru sunt stări reale din baza de date.
  private flaggedCount(): Promise<number> {
    const now = new Date();
    return this.prisma.user.count({
      where: {
        OR: [
          { bannedAt: { not: null } },
          { chatMutedUntil: { gt: now } },
          { globalChatShadowBannedUntil: { gt: now } },
          { chatReportsAgainst: { some: { resolution: 'PENDING' } } },
        ],
      },
    });
  }

  private async premiumCount(): Promise<number> {
    const rows = await this.prisma.purchase.findMany({
      where: { status: PurchaseStatus.PAID },
      distinct: ['userId'],
      select: { userId: true },
    });
    return rows.length;
  }

  private async regionalDistribution() {
    const rows = await this.prisma.user.groupBy({
      by: ['countryCode'],
      _count: { _all: true },
    });

    const totals = new Map<string, number>(CONTINENTS.map((name) => [name, 0]));
    let total = 0;
    for (const row of rows) {
      const continent = continentOf(row.countryCode);
      totals.set(continent, (totals.get(continent) ?? 0) + row._count._all);
      total += row._count._all;
    }

    return {
      total,
      buckets: CONTINENTS.map((name) => {
        const count = totals.get(name) ?? 0;
        return { name, count, sharePct: total === 0 ? 0 : Math.round((count / total) * 1000) / 10 };
      }).filter((bucket) => bucket.count > 0 || bucket.name !== 'Necunoscut'),
    };
  }

  /// Totalul cumulat de conturi, zi cu zi, pe 30 de zile.
  private async growthSeries() {
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; total: bigint; joined: bigint }>>`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '29 days',
                               date_trunc('day', now()), '1 day')::timestamp AS day
      )
      SELECT d.day,
             (SELECT COUNT(*) FROM "users" u WHERE u."created_at" < d.day + interval '1 day')::bigint AS total,
             (SELECT COUNT(*) FROM "users" u WHERE date_trunc('day', u."created_at") = d.day)::bigint AS joined
      FROM days d ORDER BY d.day
    `;
    return rows.map((row) => ({
      day: row.day,
      totalPlayers: Number(row.total),
      joined: Number(row.joined),
    }));
  }

  /// Segmentele de jucători. Fiecare e o interogare, nu o estimare.
  private async segments(now: Date, monthAgo: Date) {
    const [newPlayers, returning, vip, inactive, total] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.distinctReturning(monthAgo),
      this.premiumCount(),
      this.prisma.user.count({
        where: {
          createdAt: { lt: monthAgo },
          sessions: { none: { lastSeenAt: { gte: monthAgo } } },
        },
      }),
      this.prisma.user.count(),
    ]);

    const share = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 1000) / 10);
    return {
      total,
      rows: [
        { key: 'new', label: 'New Players', value: newPlayers, sharePct: share(newPlayers) },
        { key: 'returning', label: 'Returning Players', value: returning, sharePct: share(returning) },
        { key: 'vip', label: 'VIP / Premium', value: vip, sharePct: share(vip) },
        { key: 'inactive', label: 'Inactive (30+ days)', value: inactive, sharePct: share(inactive) },
      ],
    };
  }

  /// Conturi mai vechi de o lună care au fost active în ultima lună.
  private async distinctReturning(monthAgo: Date): Promise<number> {
    return this.prisma.user.count({
      where: {
        createdAt: { lt: monthAgo },
        sessions: { some: { lastSeenAt: { gte: monthAgo } } },
      },
    });
  }

  /// Activitatea recentă, construită doar din evenimente care s-au petrecut.
  private async recentActivity() {
    const [matches, achievements, signups, purchases] = await Promise.all([
      this.prisma.matchPlayer.findMany({
        take: 4,
        orderBy: { match: { startedAt: 'desc' } },
        where: { match: { startedAt: { not: null } } },
        select: {
          result: true,
          user: { select: { id: true, username: true, displayName: true } },
          match: { select: { startedAt: true, mode: true } },
        },
      }),
      this.prisma.userAchievement.findMany({
        take: 4,
        where: { unlockedAt: { not: null } },
        orderBy: { unlockedAt: 'desc' },
        select: {
          unlockedAt: true,
          user: { select: { id: true, username: true, displayName: true } },
          achievement: { select: { title: true } },
        },
      }),
      this.prisma.user.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, displayName: true, createdAt: true },
      }),
      this.prisma.purchase.findMany({
        take: 4,
        where: { status: PurchaseStatus.PAID },
        orderBy: { paidAt: 'desc' },
        select: {
          paidAt: true, gemsGranted: true,
          user: { select: { id: true, username: true, displayName: true } },
        },
      }),
    ]);

    const entries = [
      ...matches.map((row) => ({
        userId: row.user.id,
        name: row.user.displayName ?? row.user.username,
        text: row.result === 'WIN' ? 'won a Match' : `played a ${row.match.mode} match`,
        at: row.match.startedAt as Date,
      })),
      ...achievements.map((row) => ({
        userId: row.user.id,
        name: row.user.displayName ?? row.user.username,
        text: `unlocked ${row.achievement.title}`,
        at: row.unlockedAt as Date,
      })),
      ...signups.map((row) => ({
        userId: row.id,
        name: row.displayName ?? row.username,
        text: 'joined QuizRealm',
        at: row.createdAt,
      })),
      ...purchases.map((row) => ({
        userId: row.user.id,
        name: row.user.displayName ?? row.user.username,
        text: `bought ${row.gemsGranted} gems`,
        at: row.paidAt as Date,
      })),
    ];

    return entries
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, 5)
      .map((entry) => ({ ...entry, at: entry.at.toISOString() }));
  }

  /// Conturile cu cele mai multe rapoarte nerezolvate împotriva lor.
  private async suspiciousAccounts() {
    const grouped = await this.prisma.chatReport.groupBy({
      by: ['reportedUserId'],
      where: { resolution: 'PENDING' },
      _count: { _all: true },
      orderBy: { _count: { reportedUserId: 'desc' } },
      take: 5,
    });
    if (grouped.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((row) => row.reportedUserId) } },
      select: { id: true, username: true, displayName: true, bannedAt: true, chatMutedUntil: true },
    });
    const byId = new Map(users.map((user) => [user.id, user]));

    return grouped.map((row) => {
      const user = byId.get(row.reportedUserId);
      return {
        userId: row.reportedUserId,
        name: user?.displayName ?? user?.username ?? 'Cont șters',
        reason: user?.bannedAt ? 'Already suspended' : 'Open reports',
        count: row._count._all,
      };
    });
  }

  /// Ultimele acțiuni de moderare, din jurnalul de audit.
  private async moderationActions() {
    const rows = await this.prisma.adminAuditLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, createdAt: true, action: true, targetType: true, success: true,
        actor: { select: { username: true, displayName: true, role: true } },
        targetUser: { select: { id: true, username: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      at: row.createdAt.toISOString(),
      actor: row.actor.displayName ?? row.actor.username,
      actorRole: row.actor.role,
      action: row.action,
      target: row.targetUser
        ? `${row.targetUser.username} (${playerCode(row.targetUser.id)})`
        : (row.targetType ?? '—'),
      targetType: row.targetType ?? 'system',
      details: row.success ? 'Success' : 'Failed',
    }));
  }

  /* ------------------------------------------------------------- e-mail --- */

  /// E-mailul complet. Se cere explicit, ca dezvăluirea unei date personale să
  /// fie o acțiune distinctă, cu urmă în audit — nu un câmp care vine din
  /// oficiu cu lista.
  async revealEmail(id: string): Promise<{ email: string }> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (!user) throw new NotFoundException('Jucătorul nu există.');
    return { email: user.email };
  }
}

/* ------------------------------------------------------------- ajutoare --- */

/// Codul afișat în interfață. Derivat din uuid, deci stabil, dar mult mai
/// ușor de citit cu voce tare decât treizeci și șase de caractere.
export function playerCode(id: string): string {
  return `QR-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

function statusOf(bannedAt: Date | null, lastSeenAt: Date | null): PlayerStatus {
  if (bannedAt) return 'SUSPENDED';
  if (!lastSeenAt) return 'OFFLINE';
  const age = Date.now() - lastSeenAt.getTime();
  if (age <= ONLINE_WINDOW_MS) return 'ACTIVE';
  if (age <= IDLE_WINDOW_MS) return 'IDLE';
  return 'OFFLINE';
}

const deltaPct = (current: number, previous: number): number | null =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 1000) / 10;

/// Scorul de încredere, derivat din semnale reale, cu explicația alături.
///
/// Nu e o notă morală: e o combinație de trepte de încredere din chat
/// (`docs/features-social-progression.md` §2.5), verificări de cont și
/// rapoarte deschise. `basis` însoțește mereu cifra, ca ea să poată fi
/// contestată.
export function trustScore(input: {
  correctAnswers: number;
  emailVerified: boolean;
  twoFactor: boolean;
  reports: number;
  banned: boolean;
}): { value: number; basis: string; tier: number } {
  const tier = tierFor(input.correctAnswers);
  const tierPoints = Math.round((tier / (TRUST_TIER_COUNT - 1)) * 20);
  const reportPenalty = Math.min(input.reports * 5, 40);
  const raw =
    60 + tierPoints
    + (input.emailVerified ? 10 : 0)
    + (input.twoFactor ? 10 : 0)
    - reportPenalty
    - (input.banned ? 50 : 0);

  const parts = [
    `bază 60`,
    `treaptă de încredere T${tier} +${tierPoints}`,
    input.emailVerified ? 'e-mail confirmat +10' : 'e-mail neconfirmat +0',
    input.twoFactor ? '2FA activ +10' : '2FA inactiv +0',
    reportPenalty > 0 ? `${input.reports} rapoarte −${reportPenalty}` : 'fără rapoarte −0',
    input.banned ? 'cont suspendat −50' : null,
  ].filter(Boolean);

  return {
    value: Math.max(0, Math.min(100, raw)),
    tier,
    basis: parts.join(', '),
  };
}
