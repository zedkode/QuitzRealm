import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { verifyInitialCategoryTaxonomy } from '../src/categories/category-taxonomy.seed';

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL nu este configurat.');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  try {
    const verification = await verifyInitialCategoryTaxonomy(prisma);
    process.stdout.write(`${JSON.stringify(verification)}\n`);
    if (!verification.valid) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
