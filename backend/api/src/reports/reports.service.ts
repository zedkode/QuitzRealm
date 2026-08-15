import { Injectable } from '@nestjs/common';
import { QuestionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateReportDto) {
    return this.prisma.$transaction(async (transaction) => {
      const report = await transaction.questionReport.create({
        data: { ...dto, userId },
      });
      await transaction.question.update({
        where: { id: dto.questionId },
        data: { status: QuestionStatus.FLAGGED },
      });
      return report;
    });
  }
}
