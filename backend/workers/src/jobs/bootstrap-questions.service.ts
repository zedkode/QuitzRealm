import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  BootstrapQuestionBucket,
  BootstrapQuestionPlan,
  BOOTSTRAP_QUESTION_TARGET,
} from "../questions/bootstrap-question-plan";
import { BootstrapQuestionPlanService } from "../questions/bootstrap-question-plan.service";
import { JobsService } from "./jobs.service";

export interface BootstrapExecutionOptions {
  targetTotal?: number;
  batchSize?: number;
  concurrency?: number;
  maxAttemptsPerBucket?: number;
  language?: string;
}

export interface BootstrapBucketExecution {
  categoryId: string;
  difficulty: number;
  initiallyMissing: number;
  inserted: number;
  duplicates: number;
  rejected: number;
  attempts: number;
}

export interface BootstrapExecutionResult {
  targetTotal: number;
  existingBefore: number;
  inserted: number;
  duplicates: number;
  rejected: number;
  attempts: number;
  remaining: number;
  complete: boolean;
  buckets: BootstrapBucketExecution[];
}

interface ValidatedExecutionOptions {
  targetTotal: number;
  batchSize: number;
  concurrency: number;
  maxAttemptsPerBucket: number;
  language: string;
}

@Injectable()
export class BootstrapQuestionsService {
  private readonly logger = new Logger(BootstrapQuestionsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly planner: BootstrapQuestionPlanService,
    private readonly jobs: JobsService,
  ) {}

  async plan(
    targetTotal = BOOTSTRAP_QUESTION_TARGET,
    language = "ro",
  ): Promise<BootstrapQuestionPlan> {
    return this.planner.build(targetTotal, language);
  }

  async execute(
    rawOptions: BootstrapExecutionOptions = {},
  ): Promise<BootstrapExecutionResult> {
    const options = this.validateOptions(rawOptions);
    const provider = this.config.get<string>("AI_PROVIDER");
    if (!provider) {
      throw new Error(
        "AI_PROVIDER trebuie configurat pentru rularea bootstrap.",
      );
    }
    if (provider === "fixture") {
      throw new Error(
        "Provider-ul fixture nu este permis pentru banca bootstrap reală.",
      );
    }
    if (!this.config.get<string>("AI_VERIFIER_MODEL")) {
      throw new Error(
        "AI_VERIFIER_MODEL trebuie configurat pentru banca bootstrap reală.",
      );
    }

    const initialPlan = await this.plan(options.targetTotal, options.language);
    const work = initialPlan.buckets.filter((bucket) => bucket.missing > 0);
    const executions: BootstrapBucketExecution[] = [];
    let cursor = 0;

    const runner = async (): Promise<void> => {
      while (cursor < work.length) {
        const index = cursor;
        cursor += 1;
        executions[index] = await this.fillBucket(work[index], options);
        this.logger.log(
          `[${index + 1}/${work.length}] ${work[index].parentName} / ${work[index].categoryName}, dificultate ${work[index].difficulty}: ${executions[index].inserted} inserate, ${executions[index].duplicates} duplicate, ${executions[index].rejected} respinse semantic.`,
        );
      }
    };
    await Promise.all(
      Array.from(
        { length: Math.min(options.concurrency, work.length) },
        runner,
      ),
    );

    const finalPlan = await this.plan(options.targetTotal, options.language);
    return {
      targetTotal: options.targetTotal,
      existingBefore: initialPlan.existingTowardTarget,
      inserted: executions.reduce((sum, item) => sum + item.inserted, 0),
      duplicates: executions.reduce((sum, item) => sum + item.duplicates, 0),
      rejected: executions.reduce((sum, item) => sum + item.rejected, 0),
      attempts: executions.reduce((sum, item) => sum + item.attempts, 0),
      remaining: finalPlan.missingTotal,
      complete: finalPlan.missingTotal === 0,
      buckets: executions,
    };
  }

  private async fillBucket(
    bucket: BootstrapQuestionBucket,
    options: ValidatedExecutionOptions,
  ): Promise<BootstrapBucketExecution> {
    let remaining = bucket.missing;
    let inserted = 0;
    let duplicates = 0;
    let rejected = 0;
    let attempts = 0;
    while (remaining > 0 && attempts < options.maxAttemptsPerBucket) {
      const result = await this.jobs.enqueueGenerateQuestions({
        categoryId: bucket.categoryId,
        difficulty: bucket.difficulty,
        quantity: Math.min(remaining, options.batchSize),
        language: options.language,
      });
      attempts += 1;
      inserted += result.inserted;
      duplicates += result.duplicates;
      rejected += result.rejected;
      remaining -= result.inserted;
      if (result.inserted === 0) break;
    }
    return {
      categoryId: bucket.categoryId,
      difficulty: bucket.difficulty,
      initiallyMissing: bucket.missing,
      inserted,
      duplicates,
      rejected,
      attempts,
    };
  }

  private validateOptions(
    options: BootstrapExecutionOptions,
  ): ValidatedExecutionOptions {
    const result = {
      targetTotal: options.targetTotal ?? BOOTSTRAP_QUESTION_TARGET,
      batchSize: options.batchSize ?? 25,
      concurrency: options.concurrency ?? 2,
      maxAttemptsPerBucket: options.maxAttemptsPerBucket ?? 3,
      language: options.language?.trim() || "ro",
    };
    this.assertIntegerInRange(result.targetTotal, "targetTotal", 1, 100_000);
    this.assertIntegerInRange(result.batchSize, "batchSize", 1, 100);
    this.assertIntegerInRange(result.concurrency, "concurrency", 1, 10);
    this.assertIntegerInRange(
      result.maxAttemptsPerBucket,
      "maxAttemptsPerBucket",
      1,
      10,
    );
    if (result.language.length < 2 || result.language.length > 10) {
      throw new Error("language trebuie să aibă între 2 și 10 caractere.");
    }
    return result;
  }

  private assertIntegerInRange(
    value: number,
    name: string,
    minimum: number,
    maximum: number,
  ): void {
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new Error(`${name} trebuie să fie între ${minimum} și ${maximum}.`);
    }
  }
}
