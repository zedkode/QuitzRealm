import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const publicCategorySelect = {
  id: true,
  code: true,
  nameKey: true,
  countryCode: true,
  parentId: true,
  icon: true,
} as const;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      select: {
        ...publicCategorySelect,
        children: { select: publicCategorySelect, orderBy: { nameKey: 'asc' } },
      },
      orderBy: { nameKey: 'asc' },
    });
  }

  get(id: string) {
    return this.prisma.category.findUniqueOrThrow({
      where: { id },
      select: {
        ...publicCategorySelect,
        children: { select: publicCategorySelect, orderBy: { nameKey: 'asc' } },
      },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: dto,
      select: publicCategorySelect,
    });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
      select: publicCategorySelect,
    });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
