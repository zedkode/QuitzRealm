import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CurrencyKind, LedgerReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from './wallet.service';

/// Cu ce plătește jucătorul. Serverul verifică prețul; clientul alege doar
/// moneda, niciodată suma.
export type PayWith = 'coins' | 'gems';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  /// Catalogul vizibil jucătorilor. Doar ce e activ: obiectele scoase din
  /// vânzare rămân în baza de date pentru inventarele existente și pentru
  /// rapoarte, dar nu se mai oferă.
  async catalog() {
    const [cosmetics, powerups, gemPacks] = await Promise.all([
      this.prisma.cosmetic.findMany({
        orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
        select: {
          id: true, code: true, type: true, name: true, rarity: true,
          priceCoins: true, priceGems: true, unlockLevel: true, unlockRankOrder: true,
        },
      }),
      this.prisma.powerup.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, code: true, name: true, description: true, kind: true,
          effect: true, magnitude: true, durationSeconds: true,
          priceCoins: true, priceGems: true,
        },
      }),
      this.prisma.gemPack.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true, code: true, name: true, gems: true, bonusGems: true,
          priceCents: true, currency: true,
        },
      }),
    ]);
    return { cosmetics, powerups, gemPacks };
  }

  async inventory(userId: string) {
    const [balances, powerups, active] = await Promise.all([
      this.wallet.balances(userId),
      this.prisma.userPowerup.findMany({
        where: { userId, quantity: { gt: 0 } },
        select: { quantity: true, powerup: { select: { code: true, name: true, kind: true, effect: true } } },
      }),
      this.prisma.activePowerup.findMany({
        where: { userId, expiresAt: { gt: new Date() } },
        select: { expiresAt: true, powerup: { select: { code: true, name: true, effect: true, magnitude: true } } },
      }),
    ]);
    return { ...balances, powerups, activePowerups: active };
  }

  /// Cumpără un powerup cu moneda aleasă.
  async buyPowerup(userId: string, code: string, payWith: PayWith, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new BadRequestException('Cantitatea trebuie să fie între 1 și 99.');
    }

    const powerup = await this.prisma.powerup.findUnique({ where: { code } });
    if (!powerup || !powerup.active) {
      throw new NotFoundException('Powerup indisponibil.');
    }

    const unitPrice = payWith === 'gems' ? powerup.priceGems : powerup.priceCoins;
    if (unitPrice <= 0) {
      throw new BadRequestException('Powerup-ul nu se vinde pe moneda aleasă.');
    }

    const total = unitPrice * quantity;
    const currency = payWith === 'gems' ? CurrencyKind.GEMS : CurrencyKind.COINS;

    return this.prisma.$transaction(async (tx) => {
      const balanceAfter = await this.wallet.apply(tx, {
        userId,
        currency,
        delta: -total,
        reason: LedgerReason.SPEND,
        referenceType: 'powerup',
        referenceId: powerup.code,
        note: `${quantity} x ${powerup.name}`,
      });

      const owned = await tx.userPowerup.upsert({
        where: { userId_powerupId: { userId, powerupId: powerup.id } },
        create: { userId, powerupId: powerup.id, quantity },
        update: { quantity: { increment: quantity } },
        select: { quantity: true },
      });

      return { code: powerup.code, owned: owned.quantity, balanceAfter, currency };
    });
  }

  /// Cumpără un cosmetic. Deținerea e unică: un al doilea exemplar n-ar avea
  /// niciun efect, deci plata trebuie refuzată, nu încasată degeaba.
  async buyCosmetic(userId: string, code: string, payWith: PayWith) {
    const cosmetic = await this.prisma.cosmetic.findUnique({ where: { code } });
    if (!cosmetic) {
      throw new NotFoundException('Obiect inexistent.');
    }

    const existing = await this.prisma.userInventory.findUnique({
      where: { userId_cosmeticId: { userId, cosmeticId: cosmetic.id } },
      select: { userId: true },
    });
    if (existing) {
      throw new ConflictException('Obiectul este deja în inventar.');
    }

    const price = payWith === 'gems' ? cosmetic.priceGems : cosmetic.priceCoins;
    if (price <= 0) {
      throw new BadRequestException('Obiectul nu se vinde pe moneda aleasă.');
    }

    const currency = payWith === 'gems' ? CurrencyKind.GEMS : CurrencyKind.COINS;

    return this.prisma.$transaction(async (tx) => {
      const balanceAfter = await this.wallet.apply(tx, {
        userId,
        currency,
        delta: -price,
        reason: LedgerReason.SPEND,
        referenceType: 'cosmetic',
        referenceId: cosmetic.code,
        note: cosmetic.name,
      });

      await tx.userInventory.create({ data: { userId, cosmeticId: cosmetic.id } });

      return { code: cosmetic.code, balanceAfter, currency };
    });
  }
}
