import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  get(id: string) {
    return this.prisma.category.findUniqueOrThrow({
      where: { id },
      include: { children: true },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  update(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
