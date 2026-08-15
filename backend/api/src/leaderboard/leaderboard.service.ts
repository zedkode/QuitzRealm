import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveRank, ResolvedRank } from '../ranks/rank-tiers';

export interface LeaderboardEntry {
  position: number;
  userId: string;
  username: string;
  eloRating: number;
  matchesPlayed: number;
  rank: ResolvedRank;
}

export interface LeaderboardPage {
  total: number;
  entries: LeaderboardEntry[];
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clasamentul se citește direct din Postgres, sursa de adevăr pentru ELO.
   * Sorted set-ul din Redis (populat de `backend/workers`) rămâne pentru
   * scalare ulterioară; la volumul actual, un cache ar putea doar să livreze
   * poziții învechite imediat după o partidă.
   */
  async getTop(limit: number): Promise<LeaderboardPage> {
    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        take: limit,
        orderBy: [{ eloRating: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          username: true,
          eloRating: true,
          _count: { select: { matchPlayers: true } },
        },
      }),
    ]);

    return {
      total,
      entries: users.map((user, index) => ({
        position: index + 1,
        userId: user.id,
        username: user.username,
        eloRating: user.eloRating,
        matchesPlayed: user._count.matchPlayers,
        rank: resolveRank(user.eloRating, index + 1),
      })),
    };
  }

  /** Poziția unui jucător anume, chiar dacă e în afara primelor locuri. */
  async getPosition(userId: string): Promise<LeaderboardEntry | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        eloRating: true,
        createdAt: true,
        _count: { select: { matchPlayers: true } },
      },
    });
    if (!user) return null;

    // Poziția = câți jucători stau strict în fața ta, după aceleași criterii
    // de ordonare ca în clasament (ELO, apoi vechimea contului).
    const ahead = await this.prisma.user.count({
      where: {
        OR: [
          { eloRating: { gt: user.eloRating } },
          {
            eloRating: user.eloRating,
            createdAt: { lt: user.createdAt },
          },
        ],
      },
    });
    const position = ahead + 1;

    return {
      position,
      userId: user.id,
      username: user.username,
      eloRating: user.eloRating,
      matchesPlayed: user._count.matchPlayers,
      rank: resolveRank(user.eloRating, position),
    };
  }
}
