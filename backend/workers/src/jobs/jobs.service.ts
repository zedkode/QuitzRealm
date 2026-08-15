import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Job, Queue, QueueEvents, UnrecoverableError, Worker } from "bullmq";
import {
  GenerateQuestionsJob,
  GenerationResult,
  generateQuestionsJobSchema,
} from "../questions/question-generation.types";
import { QuestionGenerationService } from "../questions/question-generation.service";
import { QuestionBatchValidationError } from "../questions/question-batch.validator";
import {
  GENERATE_QUESTIONS_JOB,
  GENERATE_QUESTIONS_QUEUE,
  LEADERBOARD_QUEUE,
  LEADERBOARD_SCHEDULER_ID,
  RECALCULATE_LEADERBOARD_JOB,
} from "./job.constants";
import { LeaderboardResult, LeaderboardService } from "./leaderboard.service";
import { redisConnectionFromUrl } from "./redis-connection";

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private generationQueue?: Queue<GenerateQuestionsJob, GenerationResult>;
  private generationEvents?: QueueEvents;
  private generationWorker?: Worker<GenerateQuestionsJob, GenerationResult>;
  private leaderboardQueue?: Queue<Record<string, never>, LeaderboardResult>;
  private leaderboardEvents?: QueueEvents;
  private leaderboardWorker?: Worker<Record<string, never>, LeaderboardResult>;

  constructor(
    private readonly config: ConfigService,
    private readonly questionGeneration: QuestionGenerationService,
    private readonly leaderboard: LeaderboardService,
  ) {}

  async onModuleInit(): Promise<void> {
    const connection = redisConnectionFromUrl(
      this.config.getOrThrow<string>("REDIS_URL"),
    );
    this.generationQueue = new Queue(GENERATE_QUESTIONS_QUEUE, { connection });
    this.generationEvents = new QueueEvents(GENERATE_QUESTIONS_QUEUE, {
      connection,
    });
    this.generationWorker = new Worker(
      GENERATE_QUESTIONS_QUEUE,
      async (job: Job<GenerateQuestionsJob>) => {
        try {
          return await this.questionGeneration.process(job.data);
        } catch (error) {
          if (error instanceof QuestionBatchValidationError) {
            throw new UnrecoverableError(error.message);
          }
          throw error;
        }
      },
      { connection, concurrency: 2 },
    );

    this.leaderboardQueue = new Queue(LEADERBOARD_QUEUE, { connection });
    this.leaderboardEvents = new QueueEvents(LEADERBOARD_QUEUE, { connection });
    this.leaderboardWorker = new Worker(
      LEADERBOARD_QUEUE,
      () => this.leaderboard.recalculate(),
      { connection, concurrency: 1 },
    );

    this.generationWorker.on("failed", (job, error) => {
      this.logger.error(
        `${job?.name ?? GENERATE_QUESTIONS_JOB} a eșuat: ${error.message}`,
      );
    });
    this.leaderboardWorker.on("failed", (job, error) => {
      this.logger.error(
        `${job?.name ?? RECALCULATE_LEADERBOARD_JOB} a eșuat: ${error.message}`,
      );
    });

    const interval = Number(
      this.config.get<string>("LEADERBOARD_INTERVAL_MS", "300000"),
    );
    if (!Number.isSafeInteger(interval) || interval < 1_000) {
      throw new Error("LEADERBOARD_INTERVAL_MS trebuie să fie minimum 1000.");
    }
    await this.leaderboardQueue.upsertJobScheduler(
      LEADERBOARD_SCHEDULER_ID,
      { every: interval },
      { name: RECALCULATE_LEADERBOARD_JOB, data: {} },
    );
  }

  async enqueueGenerateQuestions(
    data: GenerateQuestionsJob,
  ): Promise<GenerationResult> {
    const validated = generateQuestionsJobSchema.parse(data);
    const queue = this.requireGenerationQueue();
    const events = this.requireGenerationEvents();
    const job = await queue.add(GENERATE_QUESTIONS_JOB, validated, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });
    return job.waitUntilFinished(events, 120_000);
  }

  async enqueueLeaderboardRecalculation(): Promise<LeaderboardResult> {
    const queue = this.requireLeaderboardQueue();
    const events = this.requireLeaderboardEvents();
    const job = await queue.add(
      RECALCULATE_LEADERBOARD_JOB,
      {},
      {
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );
    return job.waitUntilFinished(events, 30_000);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.generationWorker?.close(),
      this.leaderboardWorker?.close(),
    ]);
    await Promise.all([
      this.generationEvents?.close(),
      this.leaderboardEvents?.close(),
      this.generationQueue?.close(),
      this.leaderboardQueue?.close(),
    ]);
  }

  private requireGenerationQueue(): Queue<
    GenerateQuestionsJob,
    GenerationResult
  > {
    if (!this.generationQueue) throw new Error("Coada nu este inițializată.");
    return this.generationQueue;
  }

  private requireGenerationEvents(): QueueEvents {
    if (!this.generationEvents) throw new Error("Coada nu este inițializată.");
    return this.generationEvents;
  }

  private requireLeaderboardQueue(): Queue<
    Record<string, never>,
    LeaderboardResult
  > {
    if (!this.leaderboardQueue) throw new Error("Coada nu este inițializată.");
    return this.leaderboardQueue;
  }

  private requireLeaderboardEvents(): QueueEvents {
    if (!this.leaderboardEvents) throw new Error("Coada nu este inițializată.");
    return this.leaderboardEvents;
  }
}
