import { BadRequestException, Injectable } from '@nestjs/common';
import { MatchMode, MatchResult, MatchStatus } from '@prisma/client';
import { AchievementsService } from '../achievements/achievements.service';
import { PrismaService } from '../prisma/prisma.service';
import { RecordMatchDto } from './dto/record-match.dto';
import { calculateEloDelta } from './elo';

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievements: AchievementsService,
  ) {}

  history(userId: string) {
    return this.prisma.match.findMany({
      where: { players: { some: { userId } } },
      include: { players: true },
      orderBy: { endedAt: 'desc' },
    });
  }

  async record(dto: RecordMatchDto) {
    const uniqueUserIds = new Set(dto.players.map((player) => player.userId));
    if (uniqueUserIds.size !== dto.players.length) {
      throw new BadRequestException(
        'Participanții unei partide trebuie să fie diferiți.',
      );
    }
    if (Date.parse(dto.endedAt) < Date.parse(dto.startedAt)) {
      throw new BadRequestException(
        'Momentul de final nu poate preceda începutul partidei.',
      );
    }
    if (dto.mode === MatchMode.DUO) {
      if (dto.players.length !== 2) {
        throw new BadRequestException(
          'O partidă duo necesită exact doi jucători.',
        );
      }
      const results = dto.players.map((player) => player.result);
      const isDraw = results.every((result) => result === MatchResult.DRAW);
      const hasWinnerAndLoser =
        results.filter((result) => result === MatchResult.WIN).length === 1 &&
        results.filter((result) => result === MatchResult.LOSS).length === 1;
      if (!isDraw && !hasWinnerAndLoser) {
        throw new BadRequestException(
          'Rezultatele unei partide duo sunt contradictorii.',
        );
      }
    }
    if (
      dto.mode === MatchMode.CLASSIC &&
      (dto.players.length < 4 || dto.players.length > 8)
    ) {
      throw new BadRequestException(
        'O partidă clasică publică necesită între 4 și 8 jucători.',
      );
    }
    const ratings = await this.prisma.user.findMany({
      where: { id: { in: dto.players.map((player) => player.userId) } },
      select: { id: true, eloRating: true, correctAnswers: true },
    });
    if (ratings.length !== dto.players.length) {
      throw new BadRequestException('Cel puțin un jucător nu există.');
    }
    const ratingById = new Map(
      ratings.map((user) => [user.id, user.eloRating]),
    );
    const userById = new Map(ratings.map((user) => [user.id, user]));
    const scoreFor = (result: MatchResult): 0 | 0.5 | 1 =>
      result === MatchResult.WIN ? 1 : result === MatchResult.DRAW ? 0.5 : 0;

    // `correctAnswers` nu e o coloană pe `match_players`: e un contor cumulat
    // pe cont, deci se scoate din datele de creare și se aplică separat.
    const players = dto.players.map(({ correctAnswers, ...player }, index) => {
      void correctAnswers;
      return {
        ...player,
        // Rank-ul FFA bazat pe plasament aparține Fazei 3 din owner-plan.
        // Până atunci, meciurile Clasic sunt persistate fără a altera ELO;
        // Duo își păstrează formula competitivă existentă.
        eloDelta:
          dto.mode === MatchMode.DUO
            ? calculateEloDelta(
                ratingById.get(player.userId)!,
                ratingById.get(dto.players[index === 0 ? 1 : 0].userId)!,
                scoreFor(player.result),
              )
            : 0,
      };
    });

    return this.prisma.$transaction(async (transaction) => {
      const match = await transaction.match.create({
        data: {
          mode: dto.mode,
          mapId: dto.mapId,
          status: MatchStatus.COMPLETED,
          startedAt: new Date(dto.startedAt),
          endedAt: new Date(dto.endedAt),
          players: { create: players },
        },
        include: { players: true },
      });
      await Promise.all(
        dto.players.map((player, index) =>
          transaction.user.update({
            where: { id: player.userId },
            data: {
              eloRating: { increment: players[index].eloDelta },
              // Sursa treptelor de încredere din §2.5. Se cumulează în aceeași
              // tranzacție cu partida: un contor care crește fără o partidă în
              // spate ar fi exact ce vrea să evite validarea server-side.
              correctAnswers: { increment: player.correctAnswers },
            },
          }),
        ),
      );
      await this.achievements.recordValidatedMatch(
        transaction,
        dto.players.map((player) => ({
          userId: player.userId,
          correctAnswersTotal:
            userById.get(player.userId)!.correctAnswers + player.correctAnswers,
          result: player.result,
          mode: dto.mode,
        })),
      );
      return match;
    });
  }
}
