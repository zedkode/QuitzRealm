import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { JobsService } from "../jobs/jobs.service";

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const result = await app.get(JobsService).enqueueLeaderboardRecalculation();
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await app.close();
  }
}

void run();
