import { Injectable } from '@nestjs/common';
import { MatchMode, MatchResult, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACHIEVEMENT_BLUEPRINTS,
  type AchievementMetric,
  instanceKey,
  resolveTemplate,
} from './achievement-catalog';

type AchievementDb = PrismaService | Prisma.TransactionClient;

interface MatchAchievementInput {
  userId: string;
  correctAnswersTotal: number;
  result: MatchResult;
  mode: MatchMode;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  /// Expandează template-urile în instanțe doar dacă acestea nu există deja.
  /// Este sigur de apelat la bootstrap, în seed sau înaintea unei actualizări de
  /// progres: cheile stabile fac operația idempotentă.
  async ensureCatalog(db: AchievementDb = this.prisma): Promise<void> {
    for (const blueprint of ACHIEVEMENT_BLUEPRINTS) {
      const template = await db.achievementTemplate.upsert({
        where: { templateKey: blueprint.templateKey },
        create: {
          templateKey: blueprint.templateKey,
          category: blueprint.category,
          paramSchema: {
            metric: blueprint.metric,
            thresholds: blueprint.thresholds,
          },
          titleTemplate: blueprint.titleTemplate,
          descriptionTemplate: blueprint.descriptionTemplate,
          badgeAssetTemplate: blueprint.badgeAssetTemplate,
          pointsBase: blueprint.pointsBase,
        },
        update: {
          category: blueprint.category,
          paramSchema: {
            metric: blueprint.metric,
            thresholds: blueprint.thresholds,
          },
          titleTemplate: blueprint.titleTemplate,
          descriptionTemplate: blueprint.descriptionTemplate,
          badgeAssetTemplate: blueprint.badgeAssetTemplate,
          pointsBase: blueprint.pointsBase,
        },
      });

      for (const threshold of blueprint.thresholds) {
        await db.achievement.upsert({
          where: { instanceKey: instanceKey(blueprint.templateKey, threshold) },
          create: {
            templateId: template.id,
            instanceKey: instanceKey(blueprint.templateKey, threshold),
            params: { metric: blueprint.metric, threshold },
            target: threshold,
            title: resolveTemplate(blueprint.titleTemplate, threshold),
            description: resolveTemplate(blueprint.descriptionTemplate, threshold),
            points: blueprint.pointsBase * (1 + Math.floor(Math.log10(threshold))),
          },
          update: {
            params: { metric: blueprint.metric, threshold },
            target: threshold,
            title: resolveTemplate(blueprint.titleTemplate, threshold),
            description: resolveTemplate(blueprint.descriptionTemplate, threshold),
          },
        });
      }
    }
  }

  async recordValidatedMatch(
    db: AchievementDb,
    entries: readonly MatchAchievementInput[],
  ): Promise<void> {
    await this.ensureCatalog(db);
    const achievements = await db.achievement.findMany({
      select: { id: true, target: true, params: true },
    });

    for (const entry of entries) {
      const metricValues = new Map<AchievementMetric, number>([
        ['correct_answers', entry.correctAnswersTotal],
        ['matches_played', await db.matchPlayer.count({ where: { userId: entry.userId } })],
      ]);
      if (entry.result === MatchResult.WIN) {
        const metricForMode: Partial<Record<MatchMode, AchievementMetric>> = {
          [MatchMode.DUO]: 'duo_wins',
          [MatchMode.CLASSIC]: 'classic_wins',
          [MatchMode.BLITZ]: 'blitz_wins',
        };
        finalMetric: {
          const metric = metricForMode[entry.mode];
          if (!metric) break finalMetric;
          metricValues.set(
            metric,
            await db.matchPlayer.count({
              where: {
                userId: entry.userId,
                result: MatchResult.WIN,
                match: { mode: entry.mode },
              },
            }),
          );
        }
      }
      if (entry.mode === MatchMode.PRIVATE) {
        metricValues.set(
          'private_matches',
          await db.matchPlayer.count({
            where: { userId: entry.userId, match: { mode: MatchMode.PRIVATE } },
          }),
        );
      }

      for (const achievement of achievements) {
        const params = achievement.params as { metric?: AchievementMetric };
        const progress = params.metric ? metricValues.get(params.metric) : undefined;
        if (progress === undefined) continue;
        await this.upsertProgress(db, entry.userId, achievement.id, progress, achievement.target);
      }
    }
  }

  /// Raritatea derivă din rata de deblocare globală și poate fi apelată de un
  /// job periodic; nu este setată manual pe fiecare achievement.
  async recalculateRarities(): Promise<void> {
    const totalUsers = await this.prisma.user.count();
    if (totalUsers === 0) return;
    const achievements = await this.prisma.achievement.findMany({
      select: { id: true },
    });
    await Promise.all(
      achievements.map(async (achievement) => {
        const unlocked = await this.prisma.userAchievement.count({
          where: { achievementId: achievement.id, unlockedAt: { not: null } },
        });
        const ratio = unlocked / totalUsers;
        const rarity =
          ratio <= 0.001
            ? 'MYTHIC'
            : ratio <= 0.01
            ? 'LEGENDARY'
            : ratio <= 0.05
            ? 'EPIC'
            : ratio <= 0.2
            ? 'RARE'
            : 'COMMON';
        await this.prisma.achievement.update({
          where: { id: achievement.id },
          data: { rarity },
        });
      }),
    );
  }

  async listForUser(userId: string) {
    await this.ensureCatalog();
    const rows = await this.prisma.achievement.findMany({
      include: {
        userProgress: { where: { userId }, select: { progressCurrent: true, unlockedAt: true } },
      },
      orderBy: [{ rarity: 'desc' }, { points: 'desc' }, { title: 'asc' }],
    });
    return rows.map((achievement) => {
      const progress = achievement.userProgress[0];
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        rarity: achievement.rarity,
        points: achievement.points,
        target: achievement.target,
        progressCurrent: progress?.progressCurrent ?? 0,
        unlockedAt: progress?.unlockedAt ?? null,
        isHidden: achievement.isHidden,
      };
    });
  }

  async profileSummary(userId: string) {
    const [progress, badges, showcase] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId, unlockedAt: { not: null } },
        include: { achievement: { select: { points: true } } },
      }),
      this.prisma.userBadgeSlot.findMany({
        where: { userId },
        include: { achievement: { select: { id: true, title: true, rarity: true } } },
        orderBy: { slotIndex: 'asc' },
      }),
      this.prisma.userProfileShowcase.findMany({
        where: { userId },
        include: { achievement: { select: { id: true, title: true, rarity: true } } },
        orderBy: { position: 'asc' },
      }),
    ]);
    return {
      prestigeScore: progress.reduce((total, row) => total + row.achievement.points, 0),
      unlockedCount: progress.length,
      badges,
      showcase,
    };
  }

  async setBadgeSlot(userId: string, slotIndex: number, achievementId: string | null) {
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 2) {
      throw new Error('Slotul de badge este invalid.');
    }
    if (achievementId !== null) await this.assertUnlocked(userId, achievementId);
    return this.prisma.userBadgeSlot.upsert({
      where: { userId_slotIndex: { userId, slotIndex } },
      create: { userId, slotIndex, achievementId },
      update: { achievementId },
    });
  }

  async setShowcase(userId: string, achievementIds: readonly string[]) {
    if (achievementIds.length > 6 || new Set(achievementIds).size !== achievementIds.length) {
      throw new Error('Showcase-ul este invalid.');
    }
    await Promise.all(achievementIds.map((achievementId) => this.assertUnlocked(userId, achievementId)));
    await this.prisma.$transaction([
      this.prisma.userProfileShowcase.deleteMany({ where: { userId } }),
      ...achievementIds.map((achievementId, position) =>
        this.prisma.userProfileShowcase.create({ data: { userId, position, achievementId } }),
      ),
    ]);
    return this.profileSummary(userId);
  }

  private async assertUnlocked(userId: string, achievementId: string): Promise<void> {
    const progress = await this.prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
      select: { unlockedAt: true },
    });
    if (!progress?.unlockedAt) throw new Error('Achievement-ul nu este deblocat.');
  }

  private async upsertProgress(
    db: AchievementDb,
    userId: string,
    achievementId: string,
    progress: number,
    target: number,
  ): Promise<void> {
    const existing = await db.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
      select: { progressCurrent: true, unlockedAt: true },
    });
    const progressCurrent = Math.max(existing?.progressCurrent ?? 0, progress);
    const unlockedAt = existing?.unlockedAt ?? (progressCurrent >= target ? new Date() : null);
    if (existing) {
      await db.userAchievement.update({
        where: { userId_achievementId: { userId, achievementId } },
        data: { progressCurrent, unlockedAt },
      });
      return;
    }
    await db.userAchievement.create({
      data: { userId, achievementId, progressCurrent, unlockedAt },
    });
  }
}
