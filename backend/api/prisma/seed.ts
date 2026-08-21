import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import {
  seedInitialCategoryTaxonomy,
  verifyInitialCategoryTaxonomy,
} from '../src/categories/category-taxonomy.seed';
import { seedReferenceData } from '../src/reference-data/reference-data.seed';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL nu este configurat.');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const referenceData = await seedReferenceData(prisma);
    const seed = await seedInitialCategoryTaxonomy(prisma);
    const verification = await verifyInitialCategoryTaxonomy(prisma);
    if (!verification.valid) {
      throw new Error(
        `Verificarea taxonomy-ului a eșuat: ${verification.errors.join('; ')}`,
      );
    }
    process.stdout.write(
      `${JSON.stringify({ referenceData, seed, verification })}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
