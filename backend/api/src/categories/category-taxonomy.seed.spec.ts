import type { Prisma } from '@prisma/client';
import {
  syncInitialCategoryTaxonomy,
  syncInitialCategoryTranslations,
} from './category-taxonomy.seed';
import { INITIAL_TAXONOMY_TOTAL_COUNT } from './initial-taxonomy';

describe('category taxonomy seed', () => {
  it('este idempotent și păstrează identitățile și regionalizarea canonice', async () => {
    const stored = new Map<string, Record<string, unknown>>();
    const normalize = (data: Record<string, unknown>) => ({
      ...data,
      code: data.code ?? null,
      countryCode: data.countryCode ?? null,
      icon: data.icon ?? null,
      parentId: data.parentId ?? null,
    });
    const transaction = {
      category: {
        findUnique: jest.fn(
          ({ where: { id } }: { where: { id: string } }) =>
            Promise.resolve(stored.get(id) ?? null),
        ),
        findFirst: jest.fn(
          ({ where }: { where: Record<string, unknown> }) => {
            const candidates = [...stored.values()];
            const matches = (candidate: Record<string, unknown>) => {
              if ('OR' in where) {
                return (where.OR as Record<string, unknown>[]).some((clause) =>
                  Object.entries(clause).every(
                    ([key, value]) => candidate[key] === value,
                  ),
                );
              }
              return Object.entries(where).every(
                ([key, value]) => candidate[key] === value,
              );
            };
            return Promise.resolve(candidates.find(matches) ?? null);
          },
        ),
        create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
          const value = normalize(data);
          stored.set(String(value.id), value);
          return Promise.resolve(value);
        }),
        update: jest.fn(
          ({
            where: { id },
            data,
          }: {
            where: { id: string };
            data: Record<string, unknown>;
          }) => {
            const value = normalize({ ...stored.get(id), ...data, id });
            stored.set(id, value);
            return Promise.resolve(value);
          },
        ),
      },
    } as unknown as Prisma.TransactionClient;

    const first = await syncInitialCategoryTaxonomy(transaction);
    const second = await syncInitialCategoryTaxonomy(transaction);

    expect(first).toEqual({
      created: INITIAL_TAXONOMY_TOTAL_COUNT,
      updated: 0,
      unchanged: 0,
      total: INITIAL_TAXONOMY_TOTAL_COUNT,
    });
    expect(second).toEqual({
      created: 0,
      updated: 0,
      unchanged: INITIAL_TAXONOMY_TOTAL_COUNT,
      total: INITIAL_TAXONOMY_TOTAL_COUNT,
    });
    expect(stored.get('10000000-0000-4000-8000-000000000008')).toMatchObject(
      {
        code: 'country-specific-ro',
        nameKey: 'category.country-specific-ro.name',
        countryCode: 'RO',
      },
    );
    expect(stored.get('19000000-0000-4000-8000-000000000006')).toMatchObject(
      {
        code: 'international-general-knowledge',
        nameKey: 'category.international-general-knowledge.name',
        countryCode: null,
      },
    );
  });

  it('inserează numai traducerile lipsă și păstrează editările din admin', async () => {
    const stored = new Map<string, string>();
    const createMany = jest.fn(
      ({
        data,
      }: {
        data: { key: string; languageId: string; value: string }[];
      }) => {
        let count = 0;
        for (const item of data) {
          const identity = `${item.key}:${item.languageId}`;
          if (!stored.has(identity)) {
            stored.set(identity, item.value);
            count += 1;
          }
        }
        return Promise.resolve({ count });
      },
    );
    const transaction = {
      language: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'language-ro', isoCode: 'ro' },
          { id: 'language-en', isoCode: 'en' },
        ]),
      },
      translation: { createMany },
    } as unknown as Prisma.TransactionClient;

    const first = await syncInitialCategoryTranslations(transaction);
    stored.set('category.history.name:language-ro', 'Editat în admin');
    const second = await syncInitialCategoryTranslations(transaction);

    expect(first).toEqual({ inserted: 142, total: 142 });
    expect(second).toEqual({ inserted: 0, total: 142 });
    expect(stored.get('category.history.name:language-ro')).toBe(
      'Editat în admin',
    );
    expect(createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });
});
