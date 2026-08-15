import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { BootstrapQuestionsService } from "../jobs/bootstrap-questions.service";
import { PrismaService } from "../prisma/prisma.service";
import { BOOTSTRAP_QUESTION_TARGET } from "../questions/bootstrap-question-plan";
import { BootstrapQuestionPlanService } from "../questions/bootstrap-question-plan.service";

function numericArgument(name: string, fallback: number): number {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const raw = process.argv[index + 1];
  if (!raw || raw.startsWith("--")) {
    throw new Error(`Lipsește valoarea argumentului --${name}.`);
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value)) {
    throw new Error(`Argumentul --${name} trebuie să fie un număr întreg.`);
  }
  return value;
}

function stringArgument(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Lipsește valoarea argumentului --${name}.`);
  }
  return value;
}

async function run(): Promise<void> {
  const targetTotal = numericArgument("target", BOOTSTRAP_QUESTION_TARGET);
  const language = stringArgument("language", "ro");
  const execute = process.argv.includes("--execute");
  if (!execute) {
    const prisma = new PrismaService(new ConfigService());
    await prisma.onModuleInit();
    try {
      const plan = await new BootstrapQuestionPlanService(prisma).build(
        targetTotal,
        language,
      );
      const targets = plan.buckets.map((bucket) => bucket.target);
      process.stdout.write(
        `${JSON.stringify({
          mode: "plan",
          targetTotal: plan.targetTotal,
          existingTowardTarget: plan.existingTowardTarget,
          missingTotal: plan.missingTotal,
          categoryCount: plan.categoryCount,
          bucketCount: plan.bucketCount,
          minimumPerBucket: Math.min(...targets),
          maximumPerBucket: Math.max(...targets),
        })}\n`,
      );
    } finally {
      await prisma.onModuleDestroy();
    }
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const bootstrap = app.get(BootstrapQuestionsService);
    const result = await bootstrap.execute({
      targetTotal,
      language,
      batchSize: numericArgument("batch-size", 25),
      concurrency: numericArgument("concurrency", 2),
      maxAttemptsPerBucket: numericArgument("max-attempts", 3),
    });
    process.stdout.write(`${JSON.stringify({ mode: "execute", ...result })}\n`);
    if (!result.complete) process.exitCode = 2;
  } finally {
    await app.close();
  }
}

void run();
