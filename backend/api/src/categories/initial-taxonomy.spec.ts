import {
  buildInitialCategoryTranslations,
  categoryNameKey,
  INITIAL_CATEGORY_TAXONOMY,
  INITIAL_TAXONOMY_CHILD_COUNT,
  INITIAL_TAXONOMY_ROOT_COUNT,
  INITIAL_TAXONOMY_TOTAL_COUNT,
  OWNER_GAMEPLAY_CATEGORY_CODES,
  TaxonomyRoot,
  validateCategoryTranslationDefinitions,
  validateTaxonomyDefinition,
} from './initial-taxonomy';

describe('initial category taxonomy', () => {
  it('păstrează domeniile din plan și include cele 20 de categorii cerute', () => {
    expect(INITIAL_CATEGORY_TAXONOMY.map((root) => root.name)).toEqual(
      expect.arrayContaining([
        'Istorie',
        'Geografie',
        'Știință',
        'Sport',
        'Film și muzică',
        'Literatură',
        'Actualitate',
        'Specific României',
        'Cultură generală internațională',
      ]),
    );
    expect(INITIAL_TAXONOMY_ROOT_COUNT).toBe(14);
    expect(INITIAL_TAXONOMY_CHILD_COUNT).toBe(57);
    expect(INITIAL_TAXONOMY_TOTAL_COUNT).toBe(71);
    expect(OWNER_GAMEPLAY_CATEGORY_CODES).toHaveLength(20);
    expect(() =>
      validateTaxonomyDefinition(INITIAL_CATEGORY_TAXONOMY),
    ).not.toThrow();
  });

  it('separă categoriile românești de rădăcina internațională', () => {
    const nodes = INITIAL_CATEGORY_TAXONOMY.flatMap((root) => [
      root,
      ...root.children,
    ]);
    const romanianIds = [
      '11000000-0000-4000-8000-000000000001',
      '12000000-0000-4000-8000-000000000001',
      '15000000-0000-4000-8000-000000000001',
      '15000000-0000-4000-8000-000000000004',
      '16000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000008',
      '18000000-0000-4000-8000-000000000001',
      '18000000-0000-4000-8000-000000000002',
      '18000000-0000-4000-8000-000000000003',
      '18000000-0000-4000-8000-000000000004',
      '18000000-0000-4000-8000-000000000005',
      '18000000-0000-4000-8000-000000000006',
    ];
    expect(
      nodes
        .filter((node) => node.countryCode === 'RO')
        .map((node) => node.id),
    ).toEqual(expect.arrayContaining(romanianIds));
    expect(nodes.filter((node) => node.countryCode === 'RO')).toHaveLength(
      romanianIds.length,
    );

    const international = INITIAL_CATEGORY_TAXONOMY.find(
      (root) => root.code === 'international-general-knowledge',
    );
    expect(international).toMatchObject({ countryCode: undefined });
    expect(international?.children).toEqual([
      expect.objectContaining({
        code: 'international-culture',
        countryCode: undefined,
      }),
    ]);
  });

  it('definește chei stabile și traduceri ro+en pentru fiecare categorie', () => {
    expect(() => validateCategoryTranslationDefinitions()).not.toThrow();
    const nodes = INITIAL_CATEGORY_TAXONOMY.flatMap((root) => [
      root,
      ...root.children,
    ]);
    const translations = buildInitialCategoryTranslations();

    expect(translations).toHaveLength(nodes.length * 2);
    expect(
      new Set(
        translations.map(
          ({ key, languageIsoCode }) => `${key}:${languageIsoCode}`,
        ),
      ).size,
    ).toBe(translations.length);
    for (const node of nodes) {
      const localized = translations.filter(
        ({ key }) => key === categoryNameKey(node),
      );
      expect(localized.map(({ languageIsoCode }) => languageIsoCode).sort()).toEqual([
        'en',
        'ro',
      ]);
      expect(localized.every(({ value }) => value.trim().length > 0)).toBe(true);
    }
  });

  it('respinge ID-urile duplicate', () => {
    const duplicateId = [
      {
        id: '10000000-0000-4000-8000-000000000001',
        name: 'Rădăcină',
        icon: 'root',
        children: [
          {
            id: '10000000-0000-4000-8000-000000000001',
            name: 'Copil',
            icon: 'child',
          },
        ],
      },
    ] satisfies readonly TaxonomyRoot[];
    expect(() => validateTaxonomyDefinition(duplicateId)).toThrow(
      'ID invalid sau duplicat',
    );
  });

  it('respinge subcategoriile duplicate sub același părinte', () => {
    const duplicateChild = [
      {
        id: '20000000-0000-4000-8000-000000000001',
        name: 'Rădăcină',
        icon: 'root',
        children: [
          {
            id: '21000000-0000-4000-8000-000000000001',
            name: 'Copil',
            icon: 'child-a',
          },
          {
            id: '21000000-0000-4000-8000-000000000002',
            name: 'Copil',
            icon: 'child-b',
          },
        ],
      },
    ] satisfies readonly TaxonomyRoot[];
    expect(() => validateTaxonomyDefinition(duplicateChild)).toThrow(
      'Subcategorie duplicată',
    );
  });

  it('respinge un cod de țară necanonic', () => {
    const invalidCountry = [
      {
        id: '30000000-0000-4000-8000-000000000001',
        name: 'Rădăcină',
        icon: 'root',
        countryCode: 'ro',
        children: [
          {
            id: '31000000-0000-4000-8000-000000000001',
            name: 'Copil',
            icon: 'child',
          },
        ],
      },
    ] satisfies readonly TaxonomyRoot[];
    expect(() => validateTaxonomyDefinition(invalidCountry)).toThrow(
      'Cod de țară invalid',
    );
  });
});
