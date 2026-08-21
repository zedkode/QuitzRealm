import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsDto } from './dto/list-questions.dto';
import { ModerateQuestionDto } from './dto/moderate-question.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { QuestionsService } from './questions.service';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(@Query() query: ListQuestionsDto) {
    return this.questions.listApproved(query);
  }

  @Get('pool')
  getPool(@Query() query: ListQuestionsDto) {
    return this.questions.getPool(query);
  }

  @Get('internal/random')
  @UseGuards(InternalApiKeyGuard)
  getInternalRandom(@Query() query: ListQuestionsDto) {
    return this.questions.getInternalRandom(query);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.questions.getApproved(id);
  }

  @Post(':id/answer')
  @UseGuards(JwtAuthGuard)
  submitAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.questions.submitAnswer(id, dto.answer);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  create(
    @Body() dto: CreateQuestionDto,
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    return this.questions.createCommunity(dto, request.user.id);
  }

  @Patch(':id/status')
  @UseGuards(InternalApiKeyGuard)
  moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateQuestionDto,
  ) {
    return this.questions.moderate(id, dto);
  }

  @Delete(':id')
  @UseGuards(InternalApiKeyGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.questions.remove(id);
  }
}
