import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(): Promise<{ status: 'ok'; database: 'up' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'up' };
  }

  @Get('stats')
  async getPublicStats(): Promise<{
    activePlayers: number;
    matchesToday: number;
    questionsMastered: number;
    achievementsUnlocked: number;
    generatedAt: string;
  }> {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const [activePlayers, matchesToday, questionsMastered, achievementsUnlocked] = await Promise.all([
      this.prisma.userSession.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
      this.prisma.match.count({ where: { startedAt: { gte: startOfDay } } }),
      this.prisma.question.aggregate({ _sum: { timesAsked: true } }),
      this.prisma.userAchievement.count({ where: { unlockedAt: { not: null } } }),
    ]);
    return {
      activePlayers,
      matchesToday,
      questionsMastered: questionsMastered._sum.timesAsked ?? 0,
      achievementsUnlocked,
      generatedAt: now.toISOString(),
    };
  }
}
