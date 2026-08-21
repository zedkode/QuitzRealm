export interface TaxonomyNode {
  readonly id: string;
  readonly code?: string;
  readonly name: string;
  readonly icon: string;
  readonly countryCode?: string;
}

export interface TaxonomyRoot extends TaxonomyNode {
  readonly children: readonly TaxonomyNode[];
}

export const INITIAL_CATEGORY_TAXONOMY = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    code: 'history',
    name: 'Istorie',
    icon: 'landmark',
    children: [
      {
        id: '11000000-0000-4000-8000-000000000001',
        name: 'Istoria României',
        icon: 'history-romania',
        countryCode: 'RO',
      },
      {
        id: '11000000-0000-4000-8000-000000000002',
        name: 'Antichitate',
        icon: 'ancient-world',
      },
      {
        id: '11000000-0000-4000-8000-000000000003',
        code: 'medieval',
        name: 'Evul Mediu',
        icon: 'castle',
      },
      {
        id: '11000000-0000-4000-8000-000000000004',
        name: 'Epoca modernă',
        icon: 'history-modern',
      },
      {
        id: '11000000-0000-4000-8000-000000000005',
        name: 'Secolul XX',
        icon: 'history-twentieth-century',
      },
      {
        id: '11000000-0000-4000-8000-000000000006',
        name: 'Civilizații și imperii',
        icon: 'civilizations',
      },
      {
        id: '11000000-0000-4000-8000-000000000007',
        code: 'wars',
        name: 'Războaie',
        icon: 'crossed-swords',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    code: 'geography',
    name: 'Geografie',
    icon: 'public',
    children: [
      {
        id: '12000000-0000-4000-8000-000000000001',
        name: 'Geografia României',
        icon: 'map-romania',
        countryCode: 'RO',
      },
      {
        id: '12000000-0000-4000-8000-000000000002',
        name: 'Europa',
        icon: 'map-europe',
      },
      {
        id: '12000000-0000-4000-8000-000000000003',
        name: 'Asia',
        icon: 'map-asia',
      },
      {
        id: '12000000-0000-4000-8000-000000000004',
        name: 'Africa',
        icon: 'map-africa',
      },
      {
        id: '12000000-0000-4000-8000-000000000005',
        name: 'Americile și Oceania',
        icon: 'map-americas-oceania',
      },
      {
        id: '12000000-0000-4000-8000-000000000006',
        name: 'Geografie fizică',
        icon: 'terrain',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    code: 'science',
    name: 'Știință',
    icon: 'science',
    children: [
      {
        id: '13000000-0000-4000-8000-000000000001',
        name: 'Biologie',
        icon: 'biology',
      },
      {
        id: '13000000-0000-4000-8000-000000000002',
        name: 'Fizică',
        icon: 'physics',
      },
      {
        id: '13000000-0000-4000-8000-000000000003',
        name: 'Chimie',
        icon: 'chemistry',
      },
      {
        id: '13000000-0000-4000-8000-000000000004',
        code: 'space',
        name: 'Astronomie',
        icon: 'astronomy',
      },
      {
        id: '13000000-0000-4000-8000-000000000005',
        name: 'Matematică',
        icon: 'mathematics',
      },
      {
        id: '13000000-0000-4000-8000-000000000006',
        code: 'technology',
        name: 'Tehnologie și informatică',
        icon: 'technology',
      },
      {
        id: '13000000-0000-4000-8000-000000000007',
        code: 'gaming',
        name: 'Jocuri video',
        icon: 'gaming',
      },
      {
        id: '13000000-0000-4000-8000-000000000008',
        code: 'animals',
        name: 'Animale',
        icon: 'animals',
      },
      {
        id: '13000000-0000-4000-8000-000000000009',
        code: 'logic',
        name: 'Logică',
        icon: 'logic',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    code: 'sports',
    name: 'Sport',
    icon: 'sports',
    children: [
      {
        id: '14000000-0000-4000-8000-000000000001',
        name: 'Fotbal',
        icon: 'football',
      },
      {
        id: '14000000-0000-4000-8000-000000000002',
        name: 'Tenis',
        icon: 'tennis',
      },
      {
        id: '14000000-0000-4000-8000-000000000003',
        name: 'Jocuri Olimpice',
        icon: 'olympics',
      },
      {
        id: '14000000-0000-4000-8000-000000000004',
        name: 'Sporturi cu motor',
        icon: 'motorsports',
      },
      {
        id: '14000000-0000-4000-8000-000000000005',
        name: 'Baschet și handbal',
        icon: 'team-sports',
      },
      {
        id: '14000000-0000-4000-8000-000000000006',
        name: 'Recorduri sportive',
        icon: 'sports-records',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    name: 'Film și muzică',
    icon: 'movie-music',
    children: [
      {
        id: '15000000-0000-4000-8000-000000000007',
        code: 'movies',
        name: 'Filme',
        icon: 'movie',
      },
      {
        id: '15000000-0000-4000-8000-000000000008',
        code: 'music',
        name: 'Muzică',
        icon: 'music',
      },
      {
        id: '15000000-0000-4000-8000-000000000001',
        name: 'Cinema românesc',
        icon: 'romanian-cinema',
        countryCode: 'RO',
      },
      {
        id: '15000000-0000-4000-8000-000000000002',
        name: 'Film internațional',
        icon: 'international-film',
      },
      {
        id: '15000000-0000-4000-8000-000000000003',
        name: 'Seriale de televiziune',
        icon: 'television',
      },
      {
        id: '15000000-0000-4000-8000-000000000004',
        name: 'Muzică românească',
        icon: 'romanian-music',
        countryCode: 'RO',
      },
      {
        id: '15000000-0000-4000-8000-000000000005',
        name: 'Muzică internațională',
        icon: 'international-music',
      },
      {
        id: '15000000-0000-4000-8000-000000000006',
        name: 'Artele spectacolului',
        icon: 'performing-arts',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000006',
    code: 'literature',
    name: 'Literatură',
    icon: 'menu-book',
    children: [
      {
        id: '16000000-0000-4000-8000-000000000001',
        name: 'Literatură română',
        icon: 'romanian-literature',
        countryCode: 'RO',
      },
      {
        id: '16000000-0000-4000-8000-000000000002',
        name: 'Literatură universală',
        icon: 'world-literature',
      },
      {
        id: '16000000-0000-4000-8000-000000000003',
        name: 'Autori și opere',
        icon: 'authors-books',
      },
      {
        id: '16000000-0000-4000-8000-000000000004',
        name: 'Poezie',
        icon: 'poetry',
      },
      {
        id: '16000000-0000-4000-8000-000000000005',
        code: 'mythology',
        name: 'Basme și mitologie',
        icon: 'mythology',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000007',
    name: 'Actualitate',
    icon: 'newspaper',
    children: [
      {
        id: '17000000-0000-4000-8000-000000000001',
        name: 'Știință și tehnologie actuală',
        icon: 'current-technology',
      },
      {
        id: '17000000-0000-4000-8000-000000000002',
        name: 'Cultură și divertisment actual',
        icon: 'current-culture',
      },
      {
        id: '17000000-0000-4000-8000-000000000003',
        name: 'Sport actual',
        icon: 'current-sports',
      },
      {
        id: '17000000-0000-4000-8000-000000000004',
        name: 'Societate și lume',
        icon: 'current-world',
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000008',
    code: 'country-specific-ro',
    name: 'Specific României',
    icon: 'flag-romania',
    countryCode: 'RO',
    children: [
      {
        id: '18000000-0000-4000-8000-000000000001',
        name: 'Cultură și tradiții românești',
        icon: 'romanian-traditions',
        countryCode: 'RO',
      },
      {
        id: '18000000-0000-4000-8000-000000000002',
        name: 'Personalități românești',
        icon: 'romanian-people',
        countryCode: 'RO',
      },
      {
        id: '18000000-0000-4000-8000-000000000003',
        name: 'Instituții și simboluri naționale',
        icon: 'romanian-symbols',
        countryCode: 'RO',
      },
      {
        id: '18000000-0000-4000-8000-000000000004',
        name: 'Județe și orașe',
        icon: 'romanian-cities',
        countryCode: 'RO',
      },
      {
        id: '18000000-0000-4000-8000-000000000005',
        name: 'Limba română',
        icon: 'romanian-language',
        countryCode: 'RO',
      },
      {
        id: '18000000-0000-4000-8000-000000000006',
        name: 'Natură și patrimoniu românesc',
        icon: 'romanian-heritage',
        countryCode: 'RO',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000001',
    code: 'general-knowledge',
    name: 'Cultură generală',
    icon: 'general-knowledge',
    children: [
      {
        id: '19100000-0000-4000-8000-000000000001',
        name: 'Cunoaștere mixtă',
        icon: 'mixed-knowledge',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000002',
    code: 'art',
    name: 'Artă',
    icon: 'art',
    children: [
      {
        id: '19200000-0000-4000-8000-000000000001',
        name: 'Arte vizuale',
        icon: 'visual-arts',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000003',
    code: 'cars',
    name: 'Automobile',
    icon: 'cars',
    children: [
      {
        id: '19300000-0000-4000-8000-000000000001',
        name: 'Istorie și inginerie auto',
        icon: 'car-engineering',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000004',
    code: 'economy',
    name: 'Economie',
    icon: 'economy',
    children: [
      {
        id: '19400000-0000-4000-8000-000000000001',
        name: 'Economie generală',
        icon: 'economy-basics',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000005',
    code: 'royal-challenge',
    name: 'Provocarea Regală',
    icon: 'royal-challenge',
    children: [
      {
        id: '19500000-0000-4000-8000-000000000001',
        name: 'Întrebări de elită',
        icon: 'elite-questions',
      },
    ],
  },
  {
    id: '19000000-0000-4000-8000-000000000006',
    code: 'international-general-knowledge',
    name: 'Cultură generală internațională',
    icon: 'international-general-knowledge',
    children: [
      {
        id: '19600000-0000-4000-8000-000000000001',
        code: 'international-culture',
        name: 'Cultură internațională',
        icon: 'international-culture',
      },
    ],
  },
] as const satisfies readonly TaxonomyRoot[];

export const CATEGORY_TRANSLATION_LANGUAGE_CODES = ['ro', 'en'] as const;

export interface CategoryTranslationDefinition {
  readonly key: string;
  readonly languageIsoCode:
    (typeof CATEGORY_TRANSLATION_LANGUAGE_CODES)[number];
  readonly value: string;
}

/**
 * Denumirile englezești ale taxonomiei inițiale.
 *
 * Cheia este UUID-ul stabil al categoriei, nu numele românesc. Astfel o
 * corectură de copy nu schimbă identitatea traducerii și nu rupe referințele
 * existente din întrebări.
 */
export const CATEGORY_ENGLISH_NAMES: Readonly<Record<string, string>> =
  Object.freeze({
    '10000000-0000-4000-8000-000000000001': 'History',
    '11000000-0000-4000-8000-000000000001': 'Romanian History',
    '11000000-0000-4000-8000-000000000002': 'Antiquity',
    '11000000-0000-4000-8000-000000000003': 'Middle Ages',
    '11000000-0000-4000-8000-000000000004': 'Modern Era',
    '11000000-0000-4000-8000-000000000005': '20th Century',
    '11000000-0000-4000-8000-000000000006':
      'Civilizations and Empires',
    '11000000-0000-4000-8000-000000000007': 'Wars',
    '10000000-0000-4000-8000-000000000002': 'Geography',
    '12000000-0000-4000-8000-000000000001': 'Geography of Romania',
    '12000000-0000-4000-8000-000000000002': 'Europe',
    '12000000-0000-4000-8000-000000000003': 'Asia',
    '12000000-0000-4000-8000-000000000004': 'Africa',
    '12000000-0000-4000-8000-000000000005': 'Americas and Oceania',
    '12000000-0000-4000-8000-000000000006': 'Physical Geography',
    '10000000-0000-4000-8000-000000000003': 'Science',
    '13000000-0000-4000-8000-000000000001': 'Biology',
    '13000000-0000-4000-8000-000000000002': 'Physics',
    '13000000-0000-4000-8000-000000000003': 'Chemistry',
    '13000000-0000-4000-8000-000000000004': 'Astronomy',
    '13000000-0000-4000-8000-000000000005': 'Mathematics',
    '13000000-0000-4000-8000-000000000006':
      'Technology and Computing',
    '13000000-0000-4000-8000-000000000007': 'Video Games',
    '13000000-0000-4000-8000-000000000008': 'Animals',
    '13000000-0000-4000-8000-000000000009': 'Logic',
    '10000000-0000-4000-8000-000000000004': 'Sports',
    '14000000-0000-4000-8000-000000000001': 'Football',
    '14000000-0000-4000-8000-000000000002': 'Tennis',
    '14000000-0000-4000-8000-000000000003': 'Olympic Games',
    '14000000-0000-4000-8000-000000000004': 'Motorsports',
    '14000000-0000-4000-8000-000000000005':
      'Basketball and Handball',
    '14000000-0000-4000-8000-000000000006': 'Sports Records',
    '10000000-0000-4000-8000-000000000005': 'Film and Music',
    '15000000-0000-4000-8000-000000000007': 'Movies',
    '15000000-0000-4000-8000-000000000008': 'Music',
    '15000000-0000-4000-8000-000000000001': 'Romanian Cinema',
    '15000000-0000-4000-8000-000000000002': 'International Film',
    '15000000-0000-4000-8000-000000000003': 'Television Series',
    '15000000-0000-4000-8000-000000000004': 'Romanian Music',
    '15000000-0000-4000-8000-000000000005': 'International Music',
    '15000000-0000-4000-8000-000000000006': 'Performing Arts',
    '10000000-0000-4000-8000-000000000006': 'Literature',
    '16000000-0000-4000-8000-000000000001': 'Romanian Literature',
    '16000000-0000-4000-8000-000000000002': 'World Literature',
    '16000000-0000-4000-8000-000000000003': 'Authors and Works',
    '16000000-0000-4000-8000-000000000004': 'Poetry',
    '16000000-0000-4000-8000-000000000005':
      'Fairy Tales and Mythology',
    '10000000-0000-4000-8000-000000000007': 'Current Affairs',
    '17000000-0000-4000-8000-000000000001':
      'Current Science and Technology',
    '17000000-0000-4000-8000-000000000002':
      'Current Culture and Entertainment',
    '17000000-0000-4000-8000-000000000003': 'Current Sports',
    '17000000-0000-4000-8000-000000000004': 'Society and World',
    '10000000-0000-4000-8000-000000000008': 'Specific to Romania',
    '18000000-0000-4000-8000-000000000001':
      'Romanian Culture and Traditions',
    '18000000-0000-4000-8000-000000000002': 'Romanian Personalities',
    '18000000-0000-4000-8000-000000000003':
      'National Institutions and Symbols',
    '18000000-0000-4000-8000-000000000004': 'Counties and Cities',
    '18000000-0000-4000-8000-000000000005': 'Romanian Language',
    '18000000-0000-4000-8000-000000000006':
      'Romanian Nature and Heritage',
    '19000000-0000-4000-8000-000000000001': 'General Knowledge',
    '19100000-0000-4000-8000-000000000001': 'Mixed Knowledge',
    '19000000-0000-4000-8000-000000000002': 'Art',
    '19200000-0000-4000-8000-000000000001': 'Visual Arts',
    '19000000-0000-4000-8000-000000000003': 'Cars',
    '19300000-0000-4000-8000-000000000001':
      'Automotive History and Engineering',
    '19000000-0000-4000-8000-000000000004': 'Economy',
    '19400000-0000-4000-8000-000000000001': 'General Economics',
    '19000000-0000-4000-8000-000000000005': 'Royal Challenge',
    '19500000-0000-4000-8000-000000000001': 'Elite Questions',
    '19000000-0000-4000-8000-000000000006':
      'International General Knowledge',
    '19600000-0000-4000-8000-000000000001': 'International Culture',
  });

/** Cheia din SRV-003; nu depinde de textul afișat. */
export function categoryNameKey(node: TaxonomyNode): string {
  const identity =
    node.code ?? `node_${node.id.replaceAll('-', '').toLowerCase()}`;
  return `category.${identity}.name`;
}

export function buildInitialCategoryTranslations(
  taxonomy: readonly TaxonomyRoot[] = INITIAL_CATEGORY_TAXONOMY,
): readonly CategoryTranslationDefinition[] {
  const nodes = taxonomy.flatMap((root) => [root, ...root.children]);
  return nodes.flatMap((node) => {
    const english = CATEGORY_ENGLISH_NAMES[node.id];
    if (!english) {
      throw new Error(`Lipsește traducerea engleză pentru ${node.id}.`);
    }
    const key = categoryNameKey(node);
    return [
      { key, languageIsoCode: 'ro' as const, value: node.name },
      { key, languageIsoCode: 'en' as const, value: english },
    ];
  });
}

export function validateCategoryTranslationDefinitions(
  taxonomy: readonly TaxonomyRoot[] = INITIAL_CATEGORY_TAXONOMY,
): void {
  const nodes = taxonomy.flatMap((root) => [root, ...root.children]);
  const expectedPairs = new Set<string>();
  const translations = buildInitialCategoryTranslations(taxonomy);

  for (const node of nodes) {
    const key = categoryNameKey(node);
    for (const languageIsoCode of CATEGORY_TRANSLATION_LANGUAGE_CODES) {
      expectedPairs.add(`${key}\u0000${languageIsoCode}`);
    }
  }

  const actualPairs = new Set<string>();
  for (const translation of translations) {
    const pair = `${translation.key}\u0000${translation.languageIsoCode}`;
    if (actualPairs.has(pair)) {
      throw new Error(
        `Traducere duplicată pentru ${translation.key}/${translation.languageIsoCode}.`,
      );
    }
    if (!expectedPairs.has(pair)) {
      throw new Error(
        `Traducere fără categorie pentru ${translation.key}/${translation.languageIsoCode}.`,
      );
    }
    if (translation.value.trim().length === 0) {
      throw new Error(
        `Traducere goală pentru ${translation.key}/${translation.languageIsoCode}.`,
      );
    }
    actualPairs.add(pair);
  }

  for (const pair of expectedPairs) {
    if (!actualPairs.has(pair)) {
      throw new Error(`Traducere lipsă pentru ${pair.replace('\u0000', '/')}.`);
    }
  }

  if (taxonomy === INITIAL_CATEGORY_TAXONOMY) {
    const taxonomyIds = new Set(nodes.map((node) => node.id));
    for (const id of Object.keys(CATEGORY_ENGLISH_NAMES)) {
      if (!taxonomyIds.has(id)) {
        throw new Error(`Traducere engleză fără categorie pentru ${id}.`);
      }
    }
  }
}

export const OWNER_GAMEPLAY_CATEGORY_CODES = [
  'geography',
  'history',
  'science',
  'wars',
  'gaming',
  'movies',
  'music',
  'sports',
  'general-knowledge',
  'technology',
  'mythology',
  'animals',
  'space',
  'literature',
  'art',
  'cars',
  'logic',
  'economy',
  'medieval',
  'royal-challenge',
] as const;

export const INITIAL_TAXONOMY_ROOT_COUNT = INITIAL_CATEGORY_TAXONOMY.length;
export const INITIAL_TAXONOMY_CHILD_COUNT = INITIAL_CATEGORY_TAXONOMY.reduce(
  (count, root) => count + root.children.length,
  0,
);
export const INITIAL_TAXONOMY_TOTAL_COUNT =
  INITIAL_TAXONOMY_ROOT_COUNT + INITIAL_TAXONOMY_CHILD_COUNT;

export function validateTaxonomyDefinition(
  taxonomy: readonly TaxonomyRoot[],
): void {
  const ids = new Set<string>();
  const rootNames = new Set<string>();
  const codes = new Set<string>();
  const nameKeys = new Set<string>();
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  for (const root of taxonomy) {
    if (!uuidPattern.test(root.id) || ids.has(root.id)) {
      throw new Error(`ID invalid sau duplicat în taxonomy: ${root.id}`);
    }
    if (rootNames.has(root.name)) {
      throw new Error(`Categorie-rădăcină duplicată: ${root.name}`);
    }
    if (root.children.length === 0) {
      throw new Error(`Categoria ${root.name} nu are subcategorii.`);
    }
    ids.add(root.id);
    rootNames.add(root.name);
    registerCode(root, codes);
    registerNodeMetadata(root, nameKeys);

    const childNames = new Set<string>();
    for (const child of root.children) {
      if (!uuidPattern.test(child.id) || ids.has(child.id)) {
        throw new Error(`ID invalid sau duplicat în taxonomy: ${child.id}`);
      }
      if (childNames.has(child.name)) {
        throw new Error(
          `Subcategorie duplicată sub ${root.name}: ${child.name}`,
        );
      }
      ids.add(child.id);
      childNames.add(child.name);
      registerCode(child, codes);
      registerNodeMetadata(child, nameKeys);
    }
  }

  for (const code of OWNER_GAMEPLAY_CATEGORY_CODES) {
    if (!codes.has(code)) {
      throw new Error(`Categoria cerută lipsește din taxonomy: ${code}`);
    }
  }
}

function registerNodeMetadata(
  node: TaxonomyNode,
  nameKeys: Set<string>,
): void {
  if (node.name.trim().length === 0 || node.name.length > 100) {
    throw new Error(`Nume invalid în taxonomy pentru ${node.id}.`);
  }
  if (node.icon.trim().length === 0 || node.icon.length > 100) {
    throw new Error(`Icon invalid în taxonomy pentru ${node.id}.`);
  }
  if (
    node.countryCode !== undefined &&
    !/^[A-Z]{2}$/.test(node.countryCode)
  ) {
    throw new Error(`Cod de țară invalid în taxonomy: ${node.countryCode}.`);
  }
  const nameKey = categoryNameKey(node);
  if (nameKey.length > 160 || nameKeys.has(nameKey)) {
    throw new Error(`Cheie de traducere invalidă sau duplicată: ${nameKey}.`);
  }
  nameKeys.add(nameKey);
}

function registerCode(node: TaxonomyNode, codes: Set<string>): void {
  if (node.code === undefined) return;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(node.code)) {
    throw new Error(`Cod invalid în taxonomy: ${node.code}`);
  }
  if (codes.has(node.code)) {
    throw new Error(`Cod duplicat în taxonomy: ${node.code}`);
  }
  codes.add(node.code);
}
