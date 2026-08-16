import { BadRequestException, Injectable } from '@nestjs/common';
import { CurrencyKind, LedgerReason, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface WalletMovement {
  userId: string;
  currency: CurrencyKind;
  /// Pozitiv la intrare, negativ la ieșire.
  delta: number;
  reason: LedgerReason;
  referenceType?: string;
  referenceId?: string;
  actorId?: string;
  note?: string;
}

/// Singurul loc prin care se mișcă monedele.
///
/// Orice modificare de sold trece pe aici, ca fiecare gems sau coin din cont să
/// aibă o linie în registru care îl explică. Un `update` direct pe `users` ar
/// rupe tăcut rapoartele financiare, fără ca cineva să observe.
@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /// Aplică o mișcare, în interiorul tranzacției primite.
  ///
  /// Cere `tx` intenționat: schimbarea soldului și linia de registru trebuie să
  /// reușească sau să eșueze împreună. Dacă ar fi două operații separate, o
  /// cădere între ele ar lăsa gems acordați fără urmă, sau urmă fără gems.
  async apply(tx: Prisma.TransactionClient, movement: WalletMovement): Promise<number> {
    const field = movement.currency === CurrencyKind.GEMS ? 'gems' : 'coins';

    // Scăderea e condiționată pe sold suficient chiar în UPDATE: două cereri
    // simultane care cheltuie ultimul gems nu pot trece amândouă, oricât de
    // aproape ar fi în timp.
    if (movement.delta < 0) {
      const needed = -movement.delta;
      const affected = await tx.$executeRaw`
        UPDATE "users"
        SET ${Prisma.raw(`"${field}"`)} = ${Prisma.raw(`"${field}"`)} - ${needed}
        WHERE "id" = ${movement.userId}::uuid
          AND ${Prisma.raw(`"${field}"`)} >= ${needed}
      `;
      if (affected === 0) {
        throw new BadRequestException('Sold insuficient.');
      }
    } else if (movement.delta > 0) {
      await tx.user.update({
        where: { id: movement.userId },
        data: { [field]: { increment: movement.delta } },
      });
    } else {
      throw new BadRequestException('Mișcarea trebuie să fie diferită de zero.');
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: movement.userId },
      select: { coins: true, gems: true },
    });
    const balanceAfter = movement.currency === CurrencyKind.GEMS ? user.gems : user.coins;

    await tx.currencyLedger.create({
      data: {
        userId: movement.userId,
        currency: movement.currency,
        delta: movement.delta,
        balanceAfter,
        reason: movement.reason,
        referenceType: movement.referenceType ?? null,
        referenceId: movement.referenceId ?? null,
        actorId: movement.actorId ?? null,
        note: movement.note ?? null,
      },
    });

    return balanceAfter;
  }

  /// Mișcare de sine stătătoare, când apelantul nu are deja o tranzacție.
  async applyStandalone(movement: WalletMovement): Promise<number> {
    return this.prisma.$transaction((tx) => this.apply(tx, movement));
  }

  async balances(userId: string): Promise<{ coins: number; gems: number }> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { coins: true, gems: true },
    });
  }
}
