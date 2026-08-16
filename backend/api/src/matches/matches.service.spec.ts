import { BadRequestException } from '@nestjs/common';
import { MatchMode, MatchResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordMatchDto } from './dto/record-match.dto';
import { MatchesService } from './matches.service';

const userIds = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
];

function classicDto(): RecordMatchDto {
  return {
    mode: MatchMode.CLASSIC,
    mapId: 'realm-alpha',
    startedAt: '2026-08-15T10:00:00.000Z',
    endedAt: '2026-08-15T10:05:00.000Z',
    players: userIds.map((userId, index) => ({
      userId,
      territoriesWon: 4 - index,
      score: 10 - index,
      correctAnswers: 2,
      result: index === 0 ? MatchResult.WIN : MatchResult.LOSS,
    })),
  };
}

describe('MatchesService generic persistence', () => {
  const matchCreate = jest.fn();
  const userUpdate = jest.fn();
  const prisma = {
    user: { findMany: jest.fn() },
    $transaction: jest.fn(
      (operation: (transaction: unknown) => Promise<unknown>) =>
        operation({
          match: { create: matchCreate },
          user: { update: userUpdate },
        }),
    ),
  } as unknown as PrismaService;
  const service = new MatchesService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findMany as jest.Mock).mockResolvedValue(
      userIds.map((id) => ({ id, eloRating: 1000 })),
    );
    matchCreate.mockResolvedValue({ id: 'persisted-match', players: [] });
    userUpdate.mockResolvedValue({});
  });

  it('persistă o partidă Clasic cu patru participanți fără a modifica încă ELO', async () => {
    await service.record(classicDto());

    expect(matchCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mode: MatchMode.CLASSIC,
          players: {
            create: expect.arrayContaining([
              expect.objectContaining({
                userId: userIds[0],
                eloDelta: 0,
              }),
            ]),
          },
        }),
      }),
    );
    expect(userUpdate).toHaveBeenCalledTimes(4);
  });

  it('respinge participanții duplicați înainte de accesul la DB', async () => {
    const dto = classicDto();
    dto.players[1].userId = dto.players[0].userId;

    await expect(service.record(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
