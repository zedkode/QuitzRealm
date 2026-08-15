import { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { QuestionSource, QuestionStatus } from "@prisma/client";
import Redis from "ioredis";
import { AppModule } from "../src/app.module";
import { JobsService } from "../src/jobs/jobs.service";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Workers (integration)", () => {
  let app: INestApplicationContext;
  let jobs: JobsService;
  let prisma: PrismaService;
  let redis: Redis;
  let categoryId: string;
  let userId: string;

  beforeAll(async () => {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || new URL(redisUrl).pathname === "") {
      throw new Error("Testul e2e necesită un REDIS_URL cu bază dedicată.");
    }
    redis = new Redis(redisUrl);
    await redis.flushdb();
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });
    jobs = app.get(JobsService);
    prisma = app.get(PrismaService);
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const category = await prisma.category.create({
      data: { name: `Worker e2e ${suffix}` },
    });
    categoryId = category.id;
    const user = await prisma.user.create({
      data: {
        username: `worker-${suffix}`.slice(0, 32),
        email: `worker-${suffix}@example.test`,
        eloRating: 1375,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    if (prisma && categoryId) {
      await prisma.question.deleteMany({ where: { categoryId } });
      await prisma.category.delete({ where: { id: categoryId } });
    }
    if (prisma && userId) {
      await prisma.user.delete({ where: { id: userId } });
    }
    if (app) await app.close();
    if (redis) {
      await redis.flushdb();
      await redis.quit();
    }
  });

  it("generează întrebări PENDING și nu le duplică la rerulare", async () => {
    const request = {
      categoryId,
      difficulty: 3,
      quantity: 2,
      language: "ro",
    };
    await expect(jobs.enqueueGenerateQuestions(request)).resolves.toEqual({
      requested: 2,
      inserted: 2,
      duplicates: 0,
      rejected: 0,
    });
    await expect(jobs.enqueueGenerateQuestions(request)).resolves.toEqual({
      requested: 2,
      inserted: 0,
      duplicates: 2,
      rejected: 0,
    });

    const stored = await prisma.question.findMany({ where: { categoryId } });
    expect(stored).toHaveLength(2);
    expect(
      stored.every(
        (question) =>
          question.source === QuestionSource.AI &&
          question.status === QuestionStatus.PENDING &&
          typeof question.explanation === "string" &&
          typeof question.verificationSource === "string",
      ),
    ).toBe(true);
  });

  it("reconstruiește leaderboard-ul Redis din Postgres", async () => {
    const result = await jobs.enqueueLeaderboardRecalculation();
    expect(result.members).toBeGreaterThanOrEqual(1);
    await expect(
      redis.zscore("quizrealm:leaderboard:global", userId),
    ).resolves.toBe("1375");
  });
});
