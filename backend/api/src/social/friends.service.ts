import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendshipStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/// Perechea se păstrează normalizată (`a < b`) ca o relație să aibă un singur
/// rând. Fără asta, A→B și B→A ar putea exista simultan și s-ar contrazice.
function pairOf(first: string, second: string): [string, string] {
  return first < second ? [first, second] : [second, first];
}

export type FriendDirection = 'incoming' | 'outgoing' | 'mutual';

export interface FriendEntry {
  friendshipId: string;
  userId: string;
  username: string;
  displayName: string;
  status: FriendshipStatus;
  direction: FriendDirection;
  since: Date;
}

const publicUser = {
  id: true,
  username: true,
  displayName: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  /// Prietenii acceptați plus cererile în ambele sensuri, într-o singură
  /// listă: aplicația are nevoie de toate trei în același ecran.
  async list(userId: string): Promise<FriendEntry[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userIdA: userId }, { userIdB: userId }],
        status: { in: [FriendshipStatus.PENDING, FriendshipStatus.ACCEPTED] },
      },
      include: { userA: { select: publicUser }, userB: { select: publicUser } },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => {
      const other = row.userIdA === userId ? row.userB : row.userA;
      return {
        friendshipId: row.id,
        userId: other.id,
        username: other.username,
        displayName: other.displayName ?? other.username,
        status: row.status,
        direction:
          row.status === FriendshipStatus.ACCEPTED
            ? 'mutual'
            : row.requestedById === userId
              ? 'outgoing'
              : 'incoming',
        since: row.respondedAt ?? row.createdAt,
      };
    });
  }

  /// Jucători întâlniți în partide recente, fără a divulga automat identitatea
  /// nimănui: funcția cere opt-in atât de la solicitant, cât și de la candidat.
  async suggestions(userId: string) {
    const preference = await this.prisma.userPrivacySettings.findUnique({
      where: { userId },
      select: { allowFriendSuggestions: true },
    });
    if (!preference?.allowFriendSuggestions) {
      return { enabled: false, suggestions: [] };
    }

    const [matches, relationships, blocks] = await Promise.all([
      this.prisma.match.findMany({
        where: { players: { some: { userId } } },
        orderBy: [{ endedAt: 'desc' }, { startedAt: 'desc' }],
        take: 30,
        select: {
          endedAt: true,
          startedAt: true,
          players: { select: { userId: true } },
        },
      }),
      this.prisma.friendship.findMany({
        where: { OR: [{ userIdA: userId }, { userIdB: userId }] },
        select: { userIdA: true, userIdB: true },
      }),
      this.prisma.userBlock.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
      }),
    ]);

    const excluded = new Set<string>([userId]);
    for (const relationship of relationships) {
      excluded.add(
        relationship.userIdA === userId
          ? relationship.userIdB
          : relationship.userIdA,
      );
    }
    for (const block of blocks) {
      excluded.add(block.blockerId === userId ? block.blockedId : block.blockerId);
    }

    const encounters = new Map<string, { sharedMatches: number; lastPlayedAt: Date }>();
    for (const match of matches) {
      const playedAt = match.endedAt ?? match.startedAt ?? new Date(0);
      for (const player of match.players) {
        if (excluded.has(player.userId)) continue;
        const current = encounters.get(player.userId);
        encounters.set(player.userId, {
          sharedMatches: (current?.sharedMatches ?? 0) + 1,
          lastPlayedAt:
            current && current.lastPlayedAt > playedAt
              ? current.lastPlayedAt
              : playedAt,
        });
      }
    }

    const candidateIds = [...encounters.keys()];
    if (candidateIds.length === 0) return { enabled: true, suggestions: [] };

    const candidates = await this.prisma.user.findMany({
      where: {
        id: { in: candidateIds },
        privacy: { is: { allowFriendSuggestions: true } },
      },
      select: publicUser,
    });

    const suggestions = candidates
      .map((candidate) => {
        const encounter = encounters.get(candidate.id)!;
        return {
          userId: candidate.id,
          username: candidate.username,
          displayName: candidate.displayName ?? candidate.username,
          sharedMatches: encounter.sharedMatches,
          lastPlayedAt: encounter.lastPlayedAt,
        };
      })
      .sort(
        (first, second) =>
          second.sharedMatches - first.sharedMatches ||
          second.lastPlayedAt.getTime() - first.lastPlayedAt.getTime(),
      )
      .slice(0, 12);

    return { enabled: true, suggestions };
  }

  async setFriendSuggestionsEnabled(userId: string, enabled: boolean) {
    const settings = await this.prisma.userPrivacySettings.upsert({
      where: { userId },
      create: { userId, allowFriendSuggestions: enabled },
      update: { allowFriendSuggestions: enabled },
      select: { allowFriendSuggestions: true },
    });
    return { enabled: settings.allowFriendSuggestions };
  }

  /// Trimite o cerere de prietenie după handle.
  ///
  /// Dacă celălalt tocmai ne-a cerut nouă prietenia, cererea se transformă în
  /// acceptare: amândoi și-au exprimat consimțământul, n-are rost să mai
  /// așteptăm un buton.
  async request(userId: string, username: string): Promise<FriendEntry> {
    const target = await this.prisma.user.findUnique({
      where: { username: username.trim() },
      select: publicUser,
    });
    if (!target) {
      throw new NotFoundException('Nu există un jucător cu acest nume.');
    }
    if (target.id === userId) {
      throw new BadRequestException('Nu îți poți trimite cerere ție însuți.');
    }
    if (await this.isBlockedEitherWay(userId, target.id)) {
      // Mesaj neutru intenționat: dacă am spune „te-a blocat”, blocarea ar
      // deveni o notificare către cel blocat, exact ce vrea să evite.
      throw new BadRequestException('Cererea nu poate fi trimisă.');
    }

    const [userIdA, userIdB] = pairOf(userId, target.id);
    const existing = await this.prisma.friendship.findUnique({
      where: { userIdA_userIdB: { userIdA, userIdB } },
    });

    if (existing?.status === FriendshipStatus.ACCEPTED) {
      throw new ConflictException('Sunteți deja prieteni.');
    }
    if (
      existing?.status === FriendshipStatus.PENDING &&
      existing.requestedById === userId
    ) {
      throw new ConflictException('Cererea a fost deja trimisă.');
    }
    if (
      existing?.status === FriendshipStatus.PENDING &&
      existing.requestedById !== userId
    ) {
      return this.respond(userId, existing.id, true);
    }

    const row = existing
      ? // O cerere refuzată nu e o interdicție: se poate încerca din nou.
        await this.prisma.friendship.update({
          where: { id: existing.id },
          data: {
            status: FriendshipStatus.PENDING,
            requestedById: userId,
            respondedAt: null,
          },
        })
      : await this.prisma.friendship.create({
          data: { userIdA, userIdB, requestedById: userId },
        });

    return {
      friendshipId: row.id,
      userId: target.id,
      username: target.username,
      displayName: target.displayName ?? target.username,
      status: row.status,
      direction: 'outgoing',
      since: row.createdAt,
    };
  }

  /// Acceptă sau refuză o cerere. Doar destinatarul poate răspunde: altfel
  /// expeditorul și-ar putea aproba singur cererea.
  async respond(
    userId: string,
    friendshipId: string,
    accept: boolean,
  ): Promise<FriendEntry> {
    const row = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
      include: { userA: { select: publicUser }, userB: { select: publicUser } },
    });
    if (!row || (row.userIdA !== userId && row.userIdB !== userId)) {
      throw new NotFoundException('Cererea nu există.');
    }
    if (row.status !== FriendshipStatus.PENDING) {
      throw new ConflictException('Cererea a primit deja un răspuns.');
    }
    if (row.requestedById === userId) {
      throw new BadRequestException('Nu îți poți accepta propria cerere.');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: row.id },
      data: {
        status: accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED,
        respondedAt: new Date(),
      },
    });
    const other = row.userIdA === userId ? row.userB : row.userA;
    return {
      friendshipId: updated.id,
      userId: other.id,
      username: other.username,
      displayName: other.displayName ?? other.username,
      status: updated.status,
      direction: 'mutual',
      since: updated.respondedAt ?? updated.createdAt,
    };
  }

  /// Șterge relația în ambele sensuri: prietenia e reciprocă, deci și
  /// desființarea ei.
  async remove(userId: string, otherId: string): Promise<void> {
    const [userIdA, userIdB] = pairOf(userId, otherId);
    await this.prisma.friendship.deleteMany({ where: { userIdA, userIdB } });
  }

  async areFriends(userId: string, otherId: string): Promise<boolean> {
    if (userId === otherId) return false;
    const [userIdA, userIdB] = pairOf(userId, otherId);
    const row = await this.prisma.friendship.findUnique({
      where: { userIdA_userIdB: { userIdA, userIdB } },
      select: { status: true },
    });
    return row?.status === FriendshipStatus.ACCEPTED;
  }

  async friendIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ userIdA: userId }, { userIdB: userId }],
      },
      select: { userIdA: true, userIdB: true },
    });
    return rows.map((row) =>
      row.userIdA === userId ? row.userIdB : row.userIdA,
    );
  }

  // --- Blocare (§2.6) ---

  /// Blochează un jucător. Blocarea desființează și prietenia: a rămâne
  /// „prieten” cu cineva pe care l-ai blocat n-ar însemna nimic, iar lista de
  /// prieteni ar continua să-l arate.
  async block(userId: string, targetId: string): Promise<void> {
    if (userId === targetId) {
      throw new BadRequestException('Nu te poți bloca pe tine.');
    }
    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('Jucătorul nu există.');

    const [userIdA, userIdB] = pairOf(userId, targetId);
    await this.prisma.$transaction([
      this.prisma.userBlock.upsert({
        where: {
          blockerId_blockedId: { blockerId: userId, blockedId: targetId },
        },
        create: { blockerId: userId, blockedId: targetId },
        update: {},
      }),
      this.prisma.friendship.deleteMany({ where: { userIdA, userIdB } }),
    ]);
  }

  async unblock(userId: string, targetId: string): Promise<void> {
    await this.prisma.userBlock.deleteMany({
      where: { blockerId: userId, blockedId: targetId },
    });
  }

  async listBlocked(userId: string) {
    const rows = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: { blocked: { select: publicUser } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      userId: row.blocked.id,
      username: row.blocked.username,
      displayName: row.blocked.displayName ?? row.blocked.username,
      blockedAt: row.createdAt,
    }));
  }

  /// Blocarea taie comunicarea în ambele sensuri, indiferent cine a blocat:
  /// altfel cel blocat ar putea continua să scrie, iar blocarea ar fi doar un
  /// filtru de afișare.
  async isBlockedEitherWay(userId: string, otherId: string): Promise<boolean> {
    const count = await this.prisma.userBlock.count({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherId },
          { blockerId: otherId, blockedId: userId },
        ],
      },
    });
    return count > 0;
  }
}
