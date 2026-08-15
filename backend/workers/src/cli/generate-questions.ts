import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { JobsService } from "../jobs/jobs.service";

function argument(name: string, fallback?: string): string {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : fallback;
  if (!value || value.startsWith("--")) {
    throw new Error(`Lipsește argumentul --${name}.`);
  }
  return value;
}

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const result = await app.get(JobsService).enqueueGenerateQuestions({
      categoryId: argument("category-id"),
      difficulty: Number(argument("difficulty")),
      quantity: Number(argument("quantity")),
      language: argument("language", "ro"),
    });
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await app.close();
  }
}

void run();
