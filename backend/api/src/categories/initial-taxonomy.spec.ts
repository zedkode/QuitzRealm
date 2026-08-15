import {
  INITIAL_CATEGORY_TAXONOMY,
  INITIAL_TAXONOMY_CHILD_COUNT,
  INITIAL_TAXONOMY_ROOT_COUNT,
  INITIAL_TAXONOMY_TOTAL_COUNT,
  TaxonomyRoot,
  validateTaxonomyDefinition,
} from './initial-taxonomy';

describe('initial category taxonomy', () => {
  it('conține cele opt domenii din plan și 45 de subcategorii', () => {
    expect(INITIAL_CATEGORY_TAXONOMY.map((root) => root.name)).toEqual([
      'Istorie',
      'Geografie',
      'Știință',
      'Sport',
      'Film și muzică',
      'Literatură',
      'Actualitate',
      'România',
    ]);
    expect(INITIAL_TAXONOMY_ROOT_COUNT).toBe(8);
    expect(INITIAL_TAXONOMY_CHILD_COUNT).toBe(45);
    expect(INITIAL_TAXONOMY_TOTAL_COUNT).toBe(53);
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
