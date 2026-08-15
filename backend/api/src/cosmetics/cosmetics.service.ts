import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCosmeticDto } from './dto/create-cosmetic.dto';
import { GrantCosmeticDto } from './dto/grant-cosmetic.dto';

@Injectable()
export class CosmeticsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.cosmetic.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateCosmeticDto) {
    return this.prisma.cosmetic.create({ data: dto });
  }

  inventory(userId: string) {
    return this.prisma.userInventory.findMany({
      where: { userId },
      include: { cosmetic: true },
    });
  }

  grant(dto: GrantCosmeticDto) {
    return this.prisma.userInventory.upsert({
      where: {
        userId_cosmeticId: { userId: dto.userId, cosmeticId: dto.cosmeticId },
      },
      create: dto,
      update: { equipped: dto.equipped },
    });
  }
}
