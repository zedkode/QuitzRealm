import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JobsModule } from "./jobs/jobs.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QuestionsModule } from "./questions/questions.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    QuestionsModule,
    JobsModule,
  ],
})
export class AppModule {}
