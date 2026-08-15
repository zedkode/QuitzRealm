import { BadRequestException, Injectable } from '@nestjs/common';
import { MatchMode, MatchResult, MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordMatchDto } from './dto/record-match.dto';
import { calculateEloDelta } from './elo';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  history(userId: string) {
    return this.prisma.match.findMany({
      where: { players: { some: { userId } } },
      include: { players: true },
      orderBy: { endedAt: 'desc' },
    });
  }

  async record(dto: RecordMatchDto) {
    if (dto.players[0].userId === dto.players[1].userId) {
      throw new BadRequestException(
        'O partidă duo necesită doi jucători diferiți.',
      );
    }
    if (Date.parse(dto.endedAt) < Date.parse(dto.startedAt)) {
      throw new BadRequestException(
        'Momentul de final nu poate preceda începutul partidei.',
      );
    }
    if (dto.mode === MatchMode.DUO) {
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
    const ratings = await this.prisma.user.findMany({
      where: { id: { in: dto.players.map((player) => player.userId) } },
      select: { id: true, eloRating: true },
    });
    if (ratings.length !== 2) {
      throw new BadRequestException('Unul dintre jucători nu există.');
    }
    const ratingById = new Map(
      ratings.map((user) => [user.id, user.eloRating]),
    );
    const scoreFor = (result: MatchResult): 0 | 0.5 | 1 =>
      result === MatchResult.WIN ? 1 : result === MatchResult.DRAW ? 0.5 : 0;

    // `correctAnswers` nu e o coloană pe `match_players`: e un contor cumulat
    // pe cont, deci se scoate din datele de creare și se aplică separat.
    const players = dto.players.map(
      ({ correctAnswers, ...player }, index) => {
        void correctAnswers;
        const opponent = dto.players[index === 0 ? 1 : 0];
        return {
          ...player,
          eloDelta: calculateEloDelta(
            ratingById.get(player.userId)!,
            ratingById.get(opponent.userId)!,
            scoreFor(player.result),
          ),
        };
      },
    );

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
      return match;
    });
  }
}
