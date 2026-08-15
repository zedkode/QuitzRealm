import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";

export interface LeaderboardResult {
  members: number;
}

@Injectable()
export class LeaderboardService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly key: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.redis = new Redis(config.getOrThrow<string>("REDIS_URL"), {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });
    this.key = config.get<string>(
      "LEADERBOARD_REDIS_KEY",
      "quizrealm:leaderboard:global",
    );
  }

  async recalculate(): Promise<LeaderboardResult> {
    const users = await this.prisma.user.findMany({
      select: { id: true, eloRating: true },
    });
    const transaction = this.redis.multi().del(this.key);
    if (users.length > 0) {
      transaction.zadd(
        this.key,
        ...users.flatMap((user) => [user.eloRating, user.id]),
      );
    }
    const result = await transaction.exec();
    if (result === null || result.some(([error]) => error !== null)) {
      throw new Error("Actualizarea atomică a leaderboard-ului a eșuat.");
    }
    return { members: users.length };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== "end") {
      await this.redis.quit();
    }
  }
}
