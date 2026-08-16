import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService, private readonly auth: AuthService) {}

  @Get('dashboard')
  async dashboard() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 86_400_000);
    const [activeUsers, matchesPerDay, achievementsUnlocked, pendingReports, pendingQuestions] = await Promise.all([
      this.prisma.userSession.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
      this.prisma.match.count({ where: { startedAt: { gte: dayAgo } } }),
      this.prisma.userAchievement.count({ where: { unlockedAt: { not: null } } }),
      this.prisma.chatReport.count({ where: { resolution: 'PENDING' } }),
      this.prisma.question.count({ where: { status: 'PENDING' } }),
    ]);
    return { activeUsers, matchesPerDay, achievementsUnlocked, pendingReports, pendingQuestions };
  }

  @Get('users')
  users(@Query('limit') limit = '50') {
    return this.prisma.user.findMany({
      take: Math.min(Math.max(Number(limit) || 50, 1), 100),
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, email: true, role: true, bannedAt: true, createdAt: true, eloRating: true },
    });
  }

  @Patch('users/:id/ban')
  async ban(@Param('id') id: string) {
    return this.prisma.user.update({ where: { id }, data: { bannedAt: new Date() }, select: { id: true, bannedAt: true } });
  }

  @Patch('users/:id/unban')
  async unban(@Param('id') id: string) {
    return this.prisma.user.update({ where: { id }, data: { bannedAt: null }, select: { id: true, bannedAt: true } });
  }

  @Patch('users/:id/shadow-ban')
  async shadowBan(@Param('id') id: string, @Body() body: { minutes?: number }) {
    const minutes = Math.min(Math.max(Number(body.minutes) || 60, 1), 7 * 24 * 60);
    return this.prisma.user.update({ where: { id }, data: { globalChatShadowBannedUntil: new Date(Date.now() + minutes * 60_000) }, select: { id: true, globalChatShadowBannedUntil: true } });
  }

  @Post('users/:id/revoke-sessions')
  async revokeSessions(@Param('id') id: string) {
    const result = await this.prisma.userSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { revoked: result.count };
  }

  @Post('users/:id/force-password-reset')
  async forcePasswordReset(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { email: true } });
    if (user) await this.auth.requestPasswordReset(user.email);
    return { accepted: true };
  }

  @Get('reports/chat')
  chatReports() {
    return this.prisma.chatReport.findMany({ where: { resolution: 'PENDING' }, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }], take: 100, include: { reportedUser: { select: { id: true, username: true } }, reporter: { select: { username: true } } } });
  }

  @Patch('reports/chat/:id')
  resolveChatReport(@Param('id') id: string, @Body() body: { resolution: 'DISMISSED' | 'WARNED' | 'MUTED' | 'BANNED' }) {
    return this.prisma.chatReport.update({ where: { id }, data: { resolution: body.resolution, resolvedAt: new Date() } });
  }

  @Get('questions/stats')
  async questionStats() {
    const [categories, approved, pending, rejected, flagged] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.question.count({ where: { status: 'APPROVED' } }),
      this.prisma.question.count({ where: { status: 'PENDING' } }),
      this.prisma.question.count({ where: { status: 'REJECTED' } }),
      this.prisma.question.count({ where: { status: 'FLAGGED' } }),
    ]);
    return { categories, approved, pending, rejected, flagged };
  }

  @Get('questions')
  questions(@Query('status') status = 'PENDING') {
    return this.prisma.question.findMany({ where: { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED' }, orderBy: { createdAt: 'asc' }, take: 100, include: { category: true } });
  }

  @Patch('questions/:id')
  reviewQuestion(@Param('id') id: string, @Body() body: { status: 'APPROVED' | 'REJECTED' | 'FLAGGED' }, @Req() request: Request & { user: AuthenticatedUser }) {
    return this.prisma.question.update({ where: { id }, data: { status: body.status, reviewedById: request.user.id } });
  }
}
