import { Module } from "@nestjs/common";
import { QuestionsModule } from "../questions/questions.module";
import { BootstrapQuestionPlanService } from "../questions/bootstrap-question-plan.service";
import { BootstrapQuestionsService } from "./bootstrap-questions.service";
import { JobsService } from "./jobs.service";
import { LeaderboardService } from "./leaderboard.service";

@Module({
  imports: [QuestionsModule],
  providers: [
    JobsService,
    LeaderboardService,
    BootstrapQuestionPlanService,
    BootstrapQuestionsService,
  ],
  exports: [JobsService, BootstrapQuestionsService],
})
export class JobsModule {}
