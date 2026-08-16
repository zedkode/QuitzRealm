import {
  INITIAL_CATEGORY_TAXONOMY,
  INITIAL_TAXONOMY_CHILD_COUNT,
  INITIAL_TAXONOMY_ROOT_COUNT,
  INITIAL_TAXONOMY_TOTAL_COUNT,
  OWNER_GAMEPLAY_CATEGORY_CODES,
  TaxonomyRoot,
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
        'România',
      ]),
    );
    expect(INITIAL_TAXONOMY_ROOT_COUNT).toBe(13);
    expect(INITIAL_TAXONOMY_CHILD_COUNT).toBe(56);
    expect(INITIAL_TAXONOMY_TOTAL_COUNT).toBe(69);
    expect(OWNER_GAMEPLAY_CATEGORY_CODES).toHaveLength(20);
    expect(() =>
      validateTaxonomyDefinition(INITIAL_CATEGORY_TAXONOMY),
    ).not.toThrow();
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
});
